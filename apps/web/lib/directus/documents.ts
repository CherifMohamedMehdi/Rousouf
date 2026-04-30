/**
 * Document data access — the main data surface of the app.
 *
 * Every helper takes a plain options object and returns a typed
 * `Document` / `Document[]` / `SiteStats`. With `DIRECTUS_URL` unset we use
 * mocks; otherwise we read from Directus using the same JSON shape as
 * `scripts/seed.ts`.
 *
 * When Meilisearch is configured, listing and filtered browse use Meilisearch
 * for correct pagination and totals; Directus hydrates each page of hits.
 *
 * Without Meilisearch, filters that map to Directus fields use server-side
 * pagination (`limit` / `offset` / `sort` + `meta.filter_count`). Plain-text
 * `q` or `dynamicFilters` still use a capped in-memory path (500 rows).
 */
import { getDirectusCatalog, mapDirectusDocumentRow } from './catalog';
import type { DirectusCatalog } from './catalog';
import { isMockMode } from './client';
import { directusGetItem, directusListItems, directusListItemsWithMeta } from './http';
import { mockDocuments } from '@/mocks/documents';
import type { Document, SiteStats } from '@/types/directus';
import type { DocumentQuery, PaginatedDocuments } from '@/types/documentQuery';

export type { DocumentQuery, PaginatedDocuments } from '@/types/documentQuery';

/** Directus `fields` for list cards: omits heavy blobs (files, hashes, fingerprint). */
export const DIRECTUS_DOCUMENT_FIELDS_LIST =
  'id,title,author,organization,date_published,abstract_original,abstract_translations,language,themes,governorates,document_type,keywords,status,date_uploaded,date_created,date_updated,supersedes,superseded_by,source_url';

const DIRECTUS_LIST_CHUNK = 500;
/** Row id guaranteed not to exist in mocks / fixtures — yields zero rows when combined with `status`. */
const IMPOSSIBLE_DOC_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

function yearOf(iso?: string | null): number | null {
  if (!iso) return null;
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

/** Flatten nested filter objects into Directus bracket query keys. */
function flattenDirectusFilter(node: Record<string, unknown>, pathPrefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  function walk(n: unknown, path: string): void {
    if (n === null || n === undefined) return;
    if (typeof n !== 'object' || Array.isArray(n)) return;
    const obj = n as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (k === '_or' || k === '_and') {
        if (!Array.isArray(v)) continue;
        v.forEach((item, i) => walk(item, `${path}[${k}][${i}]`));
        continue;
      }
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        walk(v, `${path}[${k}]`);
      } else if (Array.isArray(v)) {
        out[`${path}[${k}]`] = v.map(String).join(',');
      } else if (v !== undefined) {
        out[`${path}[${k}]`] = String(v);
      }
    }
  }
  walk(node, pathPrefix);
  return out;
}

/**
 * Build a Directus filter for scalar / JSON-array fields on `documents`.
 * Returns a filter that matches nothing when slug lists resolve to no ids.
 */
function buildDocumentRootFilter(q: DocumentQuery, c: DirectusCatalog): Record<string, unknown> {
  const parts: Record<string, unknown>[] = [];
  const status = q.status ?? 'published';
  parts.push({ status: { _eq: status } });

  if (q.excludeId) parts.push({ id: { _neq: q.excludeId } });

  if (q.organizationId) {
    parts.push({ organization: { _eq: q.organizationId } });
  } else if (q.organizationSlugs?.length) {
    const ids = [...c.organizations.values()]
      .filter((o) => q.organizationSlugs!.includes(o.slug))
      .map((o) => o.id);
    if (!ids.length) {
      return { _and: [{ status: { _eq: status } }, { id: { _eq: IMPOSSIBLE_DOC_ID } }] };
    }
    parts.push(ids.length === 1 ? { organization: { _eq: ids[0]! } } : { organization: { _in: ids } });
  }

  if (q.typeSlugs?.length) {
    const ids = [...c.documentTypes.values()]
      .filter((t) => q.typeSlugs!.includes(t.slug))
      .map((t) => t.id);
    if (!ids.length) {
      return { _and: [{ status: { _eq: status } }, { id: { _eq: IMPOSSIBLE_DOC_ID } }] };
    }
    parts.push(ids.length === 1 ? { document_type: { _eq: ids[0]! } } : { document_type: { _in: ids } });
  }

  if (q.languageSlugs?.length) {
    const ids = [...c.languages.values()]
      .filter((l) => q.languageSlugs!.includes(l.slug))
      .map((l) => l.id);
    if (!ids.length) {
      return { _and: [{ status: { _eq: status } }, { id: { _eq: IMPOSSIBLE_DOC_ID } }] };
    }
    parts.push(ids.length === 1 ? { language: { _eq: ids[0]! } } : { language: { _in: ids } });
  }

  if (q.yearFrom) parts.push({ date_published: { _gte: `${q.yearFrom}-01-01` } });
  if (q.yearTo) parts.push({ date_published: { _lte: `${q.yearTo}-12-31` } });

  if (q.themeSlugs?.length) {
    const ids = [...c.themes.values()]
      .filter((t) => q.themeSlugs!.includes(t.slug))
      .map((t) => t.id);
    if (!ids.length) {
      return { _and: [{ status: { _eq: status } }, { id: { _eq: IMPOSSIBLE_DOC_ID } }] };
    }
    if (ids.length === 1) parts.push({ themes: { _contains: ids[0]! } });
    else parts.push({ _or: ids.map((id) => ({ themes: { _contains: id } })) });
  }

  if (q.governorateSlugs?.length) {
    const ids = [...c.governorates.values()]
      .filter((g) => q.governorateSlugs!.includes(g.slug))
      .map((g) => g.id);
    if (!ids.length) {
      return { _and: [{ status: { _eq: status } }, { id: { _eq: IMPOSSIBLE_DOC_ID } }] };
    }
    if (ids.length === 1) parts.push({ governorates: { _contains: ids[0]! } });
    else parts.push({ _or: ids.map((id) => ({ governorates: { _contains: id } })) });
  }

  if (parts.length === 1) return parts[0]!;
  return { _and: parts };
}

function canUseDirectusDocumentApi(q: DocumentQuery): boolean {
  if (q.q?.trim()) return false;
  if (q.dynamicFilters && Object.keys(q.dynamicFilters).length > 0) return false;
  return true;
}

async function getDocumentsDirectusFilteredPaged(effective: DocumentQuery): Promise<PaginatedDocuments> {
  const c = await getDirectusCatalog();
  const root = buildDocumentRootFilter(effective, c);
  const filterParams = flattenDirectusFilter(root, 'filter');
  const sort = effective.sort === 'oldest' ? 'date_published' : '-date_published';

  const { meta: countMeta } = await directusListItemsWithMeta<Record<string, unknown>>('documents', {
    ...filterParams,
    sort,
    limit: '0',
    meta: 'filter_count',
    fields: 'id',
  });
  const total = countMeta.filter_count ?? 0;

  const offset = Math.max(0, effective.offset ?? 0);
  const rawLimit =
    effective.limit !== undefined ? effective.limit : Math.max(0, Math.min(total - offset, 10_000));
  const span = Math.min(Math.max(rawLimit, 0), 1_000_000);
  const end = Math.min(offset + span, total);

  const rowsOut: Record<string, unknown>[] = [];
  let cur = offset;
  while (cur < end) {
    const take = Math.min(DIRECTUS_LIST_CHUNK, end - cur);
    const batch = await directusListItems<Record<string, unknown>>('documents', {
      ...filterParams,
      sort,
      limit: String(take),
      offset: String(cur),
      fields: DIRECTUS_DOCUMENT_FIELDS_LIST,
    });
    if (!batch.length) break;
    rowsOut.push(...batch);
    cur += batch.length;
  }

  const items = rowsOut.map((r) => mapDirectusDocumentRow(r, c));
  return { items, total };
}

function matchesQuery(doc: Document, query: DocumentQuery): boolean {
  if (query.status && doc.status !== query.status) return false;

  if (query.themeSlugs?.length) {
    const docSlugs = new Set(doc.themes.map((t) => t.slug));
    if (!query.themeSlugs.some((s) => docSlugs.has(s))) return false;
  }

  if (query.typeSlugs?.length) {
    if (!doc.document_type || !query.typeSlugs.includes(doc.document_type.slug)) return false;
  }

  if (query.governorateSlugs?.length) {
    const docSlugs = new Set(doc.governorates.map((g) => g.slug));
    if (!query.governorateSlugs.some((s) => docSlugs.has(s))) return false;
  }

  if (query.languageSlugs?.length) {
    if (!doc.language || !query.languageSlugs.includes(doc.language.slug)) return false;
  }

  if (query.organizationSlugs?.length) {
    if (!doc.organization || !query.organizationSlugs.includes(doc.organization.slug)) return false;
  }

  if (query.organizationId && doc.organization?.id !== query.organizationId) return false;

  if (query.yearFrom) {
    const y = yearOf(doc.date_published);
    if (y === null || y < query.yearFrom) return false;
  }
  if (query.yearTo) {
    const y = yearOf(doc.date_published);
    if (y === null || y > query.yearTo) return false;
  }

  if (query.q) {
    const q = query.q.toLowerCase();
    const haystack = [
      doc.title,
      doc.author ?? '',
      doc.organization?.name ?? '',
      doc.abstract_original ?? '',
      ...(doc.keywords ?? []),
      ...doc.themes.map((t) => [t.name_en, t.name_fr, t.name_ar].join(' ')),
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (query.excludeId && doc.id === query.excludeId) return false;
  if (query.dynamicFilters) {
    const source = doc as unknown as Record<string, unknown>;
    for (const [field, accepted] of Object.entries(query.dynamicFilters)) {
      if (!accepted.length) continue;
      const raw = source[field];
      if (raw === undefined || raw === null) return false;
      if (Array.isArray(raw)) {
        const values = raw
          .map((item) => {
            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') return String(item);
            if (item && typeof item === 'object') {
              const obj = item as Record<string, unknown>;
              return typeof obj.slug === 'string'
                ? obj.slug
                : typeof obj.id === 'string'
                  ? obj.id
                  : typeof obj.value === 'string'
                    ? obj.value
                    : null;
            }
            return null;
          })
          .filter((v): v is string => Boolean(v));
        if (!accepted.some((v) => values.includes(v))) return false;
      } else if (typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        const value =
          (typeof obj.slug === 'string' && obj.slug) ||
          (typeof obj.id === 'string' && obj.id) ||
          (typeof obj.value === 'string' && obj.value) ||
          '';
        if (!accepted.includes(value)) return false;
      } else if (!accepted.includes(String(raw))) {
        return false;
      }
    }
  }

  return true;
}

function sortDocs(docs: Document[], sort: DocumentQuery['sort']): Document[] {
  const out = [...docs];
  if (sort === 'oldest') {
    out.sort((a, b) => (a.date_published ?? '').localeCompare(b.date_published ?? ''));
  } else {
    out.sort((a, b) => (b.date_published ?? '').localeCompare(a.date_published ?? ''));
  }
  return out;
}

async function loadDocumentsFromDirectus(status?: Document['status']): Promise<Document[]> {
  const c = await getDirectusCatalog();
  const params: Record<string, string> = {
    limit: '500',
    sort: '-date_published',
    fields: DIRECTUS_DOCUMENT_FIELDS_LIST,
  };
  if (status) params['filter[status][_eq]'] = status;
  const rows = await directusListItems<Record<string, unknown>>('documents', params);
  return rows.map((r) => mapDirectusDocumentRow(r, c));
}

export type DocumentHydrationMode = 'list' | 'full';

/** Batch-fetch documents for Meilisearch hit hydration or export. */
export async function getDocumentsByIds(
  ids: string[],
  mode: DocumentHydrationMode = 'list',
): Promise<Map<string, Document>> {
  const map = new Map<string, Document>();
  if (!ids.length || isMockMode()) return map;
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return map;
  try {
    const c = await getDirectusCatalog();
    const fields = mode === 'list' ? DIRECTUS_DOCUMENT_FIELDS_LIST : '*';
    const rows = await directusListItems<Record<string, unknown>>('documents', {
      'filter[id][_in]': unique.join(','),
      limit: '500',
      fields,
    });
    for (const r of rows) {
      const d = mapDirectusDocumentRow(r, c);
      map.set(d.id, d);
    }
  } catch {
    // leave map partial
  }
  return map;
}

async function getDocumentsViaMeilisearch(query: DocumentQuery): Promise<PaginatedDocuments> {
  const { documentSearchToPaginated } = await import('@/lib/search/meilisearch');
  return documentSearchToPaginated(query);
}

export async function getDocuments(query: DocumentQuery = {}): Promise<PaginatedDocuments> {
  const effective = { status: 'published' as Document['status'], ...query };
  if (isMockMode()) {
    const matched = mockDocuments.filter((d) => matchesQuery(d, effective));
    const sorted = sortDocs(matched, effective.sort);
    const total = sorted.length;
    const offset = effective.offset ?? 0;
    const limit = effective.limit ?? sorted.length;
    return { items: sorted.slice(offset, offset + limit), total };
  }

  if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_KEY) {
    try {
      return await getDocumentsViaMeilisearch(effective);
    } catch {
      // fall through to Directus legacy path
    }
  }

  try {
    if (canUseDirectusDocumentApi(effective)) {
      return await getDocumentsDirectusFilteredPaged(effective);
    }
    const all = await loadDocumentsFromDirectus(effective.status);
    const matched = all.filter((d) => matchesQuery(d, effective));
    const sorted = sortDocs(matched, effective.sort);
    const total = sorted.length;
    const offset = effective.offset ?? 0;
    const limit = effective.limit ?? sorted.length;
    return { items: sorted.slice(offset, offset + limit), total };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getDocumentById(id: string): Promise<Document | null> {
  if (isMockMode()) {
    return mockDocuments.find((d) => d.id === id) ?? null;
  }
  try {
    const c = await getDirectusCatalog();
    const row = await directusGetItem<Record<string, unknown>>('documents', id);
    if (!row) return null;
    return mapDirectusDocumentRow(row, c);
  } catch {
    return null;
  }
}

export async function getRecentDocuments(limit = 6): Promise<Document[]> {
  const { items } = await getDocuments({ limit, sort: 'recent', status: 'published' });
  return items;
}

export async function getRelatedByOrganization(
  docId: string,
  orgId: string | null,
  limit = 5,
): Promise<Document[]> {
  if (!orgId) return [];
  const { items } = await getDocuments({
    limit,
    organizationId: orgId,
    excludeId: docId,
    status: 'published',
    sort: 'recent',
  });
  return items;
}

export async function getRelatedByTheme(
  docId: string,
  themeSlug: string | null,
  limit = 5,
): Promise<Document[]> {
  if (!themeSlug) return [];
  const { items } = await getDocuments({
    limit,
    themeSlugs: [themeSlug],
    excludeId: docId,
    status: 'published',
    sort: 'recent',
  });
  return items;
}

/**
 * Counts distinct organization UUIDs on published documents (not “all active orgs” in the catalog).
 * Used by `getSiteStats` so homepage numbers stay aligned with browse filters.
 */
async function countDistinctOrganizationsPublished(): Promise<number> {
  const orgs = new Set<string>();
  let offset = 0;
  for (;;) {
    const rows = await directusListItems<{ organization?: string | null }>('documents', {
      'filter[status][_eq]': 'published',
      fields: 'organization',
      limit: String(DIRECTUS_LIST_CHUNK),
      offset: String(offset),
      sort: 'id',
    });
    for (const r of rows) {
      if (r.organization) orgs.add(String(r.organization));
    }
    if (rows.length < DIRECTUS_LIST_CHUNK) break;
    offset += DIRECTUS_LIST_CHUNK;
  }
  return orgs.size;
}

async function getSiteStatsFromDirectus(): Promise<SiteStats> {
  const { meta: countMeta } = await directusListItemsWithMeta<Record<string, unknown>>('documents', {
    'filter[status][_eq]': 'published',
    limit: '0',
    meta: 'filter_count',
  });
  const total_documents = countMeta.filter_count ?? 0;

  const [earliestRows, latestRows] = await Promise.all([
    directusListItems<{ date_published?: string | null }>('documents', {
      'filter[status][_eq]': 'published',
      fields: 'date_published',
      sort: 'date_published',
      limit: '50',
    }),
    directusListItems<{ date_published?: string | null }>('documents', {
      'filter[status][_eq]': 'published',
      fields: 'date_published',
      sort: '-date_published',
      limit: '50',
    }),
  ]);

  const years: number[] = [];
  const earliestDate = earliestRows.map((r) => r.date_published).find((d) => d && String(d).trim());
  const latestDate = latestRows.map((r) => r.date_published).find((d) => d && String(d).trim());
  const ey = yearOf(earliestDate ?? null);
  const ly = yearOf(latestDate ?? null);
  if (ey !== null) years.push(ey);
  if (ly !== null) years.push(ly);

  const total_organizations = await countDistinctOrganizationsPublished();

  return {
    total_documents,
    total_organizations,
    earliest_year: years.length ? Math.min(...years) : 2011,
    latest_year: years.length ? Math.max(...years) : new Date().getFullYear(),
  };
}

export async function getSiteStats(): Promise<SiteStats> {
  if (isMockMode()) {
    const published = mockDocuments.filter((d) => d.status === 'published');
    const orgs = new Set(published.map((d) => d.organization?.id).filter(Boolean));
    const years = published
      .map((d) => yearOf(d.date_published))
      .filter((y): y is number => y !== null);
    return {
      total_documents: published.length,
      total_organizations: orgs.size,
      earliest_year: years.length ? Math.min(...years) : 2011,
      latest_year: years.length ? Math.max(...years) : new Date().getFullYear(),
    };
  }

  try {
    return await getSiteStatsFromDirectus();
  } catch {
    return { total_documents: 0, total_organizations: 0, earliest_year: 2011, latest_year: new Date().getFullYear() };
  }
}

export async function getAllPublishedDocuments(): Promise<Document[]> {
  if (isMockMode()) {
    return mockDocuments.filter((d) => d.status === 'published');
  }

  if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_KEY) {
    try {
      const { documentSearchToPaginated } = await import('@/lib/search/meilisearch');
      const out: Document[] = [];
      let offset = 0;
      for (;;) {
        const { items, total } = await documentSearchToPaginated({
          status: 'published',
          limit: DIRECTUS_LIST_CHUNK,
          offset,
          sort: 'recent',
        });
        out.push(...items);
        if (items.length === 0 || out.length >= total) break;
        offset += DIRECTUS_LIST_CHUNK;
      }
      return out;
    } catch {
      // fall through
    }
  }

  const { items } = await getDocuments({ status: 'published', limit: 10000, offset: 0 });
  return items;
}
