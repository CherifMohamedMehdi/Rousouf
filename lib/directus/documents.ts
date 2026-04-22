/**
 * Document data access — the main data surface of the app.
 *
 * Every helper takes a plain options object and returns a typed
 * `Document` / `Document[]` / `SiteStats`. With `DIRECTUS_URL` unset we use
 * mocks; otherwise we read from Directus using the same JSON shape as
 * `scripts/seed.ts`.
 */
import { getDirectusCatalog, mapDirectusDocumentRow } from './catalog';
import { isMockMode } from './client';
import { directusGetItem, directusListItems } from './http';
import { mockDocuments } from '@/mocks/documents';
import type { Document, SiteStats } from '@/types/directus';

export interface DocumentQuery {
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'oldest' | 'relevant';
  status?: Document['status'];
  themeSlugs?: string[];
  typeSlugs?: string[];
  governorateSlugs?: string[];
  languageSlugs?: string[];
  organizationSlugs?: string[];
  organizationId?: string;
  yearFrom?: number;
  yearTo?: number;
  q?: string;
  excludeId?: string;
  dynamicFilters?: Record<string, string[]>;
}

export interface PaginatedDocuments {
  items: Document[];
  total: number;
}

function yearOf(iso?: string | null): number | null {
  if (!iso) return null;
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) ? y : null;
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
  };
  if (status) params['filter[status][_eq]'] = status;
  const rows = await directusListItems<Record<string, unknown>>('documents', params);
  return rows.map((r) => mapDirectusDocumentRow(r, c));
}

/** Batch-fetch full documents for Meilisearch hit hydration. */
export async function getDocumentsByIds(ids: string[]): Promise<Map<string, Document>> {
  const map = new Map<string, Document>();
  if (!ids.length || isMockMode()) return map;
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return map;
  try {
    const c = await getDirectusCatalog();
    const rows = await directusListItems<Record<string, unknown>>('documents', {
      'filter[id][_in]': unique.join(','),
      limit: '500',
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

  try {
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
    const published = await loadDocumentsFromDirectus('published');
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
  } catch {
    return { total_documents: 0, total_organizations: 0, earliest_year: 2011, latest_year: new Date().getFullYear() };
  }
}

export async function getAllPublishedDocuments(): Promise<Document[]> {
  const { items } = await getDocuments({ status: 'published', limit: 10000 });
  return items;
}
