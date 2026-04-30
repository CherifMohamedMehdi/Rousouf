/**
 * Meilisearch abstraction.
 *
 * In dev the search runs in-process against the mock corpus (keyword +
 * trigram fallback) and produces highlighted snippets compatible with the
 * same render code used for real Meilisearch responses.
 *
 * When MEILISEARCH_HOST and MEILISEARCH_KEY are set, swap the `searchMock`
 * body for a real MeiliSearch call — the function signature stays the same.
 */
import { MeiliSearch } from 'meilisearch';
import { isMockMode } from '@/lib/directus/client';
import { getDocumentsByIds } from '@/lib/directus/documents';
import type { DocumentQuery, PaginatedDocuments } from '@/types/documentQuery';
import type { Document } from '@/types/directus';
import { mockDocuments } from '@/mocks/documents';
import { stopWords } from './meiliConfig';

export interface SearchQuery {
  q: string;
  themeSlugs?: string[];
  typeSlugs?: string[];
  governorateSlugs?: string[];
  languageSlugs?: string[];
  organizationSlugs?: string[];
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  offset?: number;
  dynamicFilters?: Record<string, string[]>;
  /** Browse / listing sort when using Meilisearch as a document store (not keyword relevance). */
  listSort?: 'recent' | 'oldest' | 'relevant';
}

export interface SearchHit {
  document: Document;
  highlightedTitle?: string;
  highlightedSnippet?: string;
  score: number;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  query: string;
}

function isRealMeili(): boolean {
  return Boolean(process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_KEY);
}

/** True when Meilisearch env is configured (used for browse + search). */
export function isMeilisearchEnabled(): boolean {
  return isRealMeili();
}

function meiliClient(): MeiliSearch {
  return new MeiliSearch({
    host: process.env.MEILISEARCH_HOST!,
    apiKey: process.env.MEILISEARCH_KEY!,
  });
}

export async function search(query: SearchQuery): Promise<SearchResult> {
  if (!isRealMeili()) return searchMock(query);
  return searchReal(query);
}

async function searchReal(query: SearchQuery): Promise<SearchResult> {
  const client = meiliClient();
  const index = client.index<Document>('documents');
  const filters: string[] = ['status = "published"'];
  if (query.themeSlugs?.length) filters.push(query.themeSlugs.map((s) => `themes.slug = "${s}"`).join(' OR '));
  if (query.typeSlugs?.length) filters.push(query.typeSlugs.map((s) => `document_type.slug = "${s}"`).join(' OR '));
  if (query.governorateSlugs?.length)
    filters.push(query.governorateSlugs.map((s) => `governorates.slug = "${s}"`).join(' OR '));
  if (query.languageSlugs?.length)
    filters.push(query.languageSlugs.map((s) => `language.slug = "${s}"`).join(' OR '));
  if (query.organizationSlugs?.length)
    filters.push(query.organizationSlugs.map((s) => `organization.slug = "${s}"`).join(' OR '));
  if (query.yearFrom) filters.push(`date_published >= "${query.yearFrom}-01-01"`);
  if (query.yearTo) filters.push(`date_published <= "${query.yearTo}-12-31"`);
  if (query.dynamicFilters) {
    for (const [field, values] of Object.entries(query.dynamicFilters)) {
      if (!values.length) continue;
      filters.push(values.map((value) => `${field} = "${value}"`).join(' OR '));
    }
  }

  const qTrim = query.q?.trim() ?? '';
  const sort =
    query.listSort === 'oldest'
      ? (['date_published:asc'] as const)
      : qTrim.length > 0 && query.listSort === 'relevant'
        ? undefined
        : (['date_published:desc'] as const);

  const res = await index.search(query.q ?? '', {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    filter: filters.join(' AND '),
    ...(sort ? { sort: [...sort] } : {}),
    attributesToHighlight: ['title', 'abstract_original', 'abstract_translations.ar', 'abstract_translations.fr', 'abstract_translations.en', 'keywords'],
    attributesToCrop: ['abstract_original'],
    cropLength: 220,
    matchingStrategy: 'all',
  });

  const ids = res.hits.map((h) => String((h as { id?: string }).id ?? '')).filter(Boolean);
  const byId =
    !isMockMode() && process.env.DIRECTUS_URL ? await getDocumentsByIds(ids, 'list') : new Map<string, Document>();

  return {
    hits: res.hits.map((h) => {
      const hid = String((h as { id?: string }).id ?? '');
      const full = byId.get(hid);
      return {
        document: (full ?? (h as unknown as Document)) as Document,
        highlightedTitle: (h as { _formatted?: { title?: string } })._formatted?.title,
        highlightedSnippet: (h as { _formatted?: { abstract_original?: string } })._formatted?.abstract_original,
        score: 1,
      };
    }),
    total: res.estimatedTotalHits ?? res.hits.length,
    query: query.q,
  };
}

// ---------------------------------------------------------------------------
// Mock search
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !stopWords.includes(t));
}

function bigrams(text: string): Set<string> {
  const tokens = tokenize(text).join(' ');
  const set = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) set.add(tokens.slice(i, i + 2));
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersect = 0;
  for (const item of a) if (b.has(item)) intersect++;
  return intersect / (a.size + b.size - intersect);
}

function highlight(text: string, terms: string[], max = 220): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  const firstHit = terms
    .map((t) => lower.indexOf(t))
    .filter((idx) => idx >= 0)
    .sort((a, b) => a - b)[0];
  const start = Math.max(0, firstHit !== undefined ? firstHit - 40 : 0);
  let snippet = text.slice(start, start + max);
  if (start > 0) snippet = `…${snippet}`;
  if (start + max < text.length) snippet = `${snippet}…`;
  for (const t of terms) {
    if (!t) continue;
    const re = new RegExp(`(${escapeRegex(t)})`, 'gi');
    snippet = snippet.replace(re, '<mark>$1</mark>');
  }
  return snippet;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesFilters(doc: Document, q: SearchQuery): boolean {
  if (doc.status !== 'published') return false;
  if (q.themeSlugs?.length) {
    const s = new Set(doc.themes.map((t) => t.slug));
    if (!q.themeSlugs.some((x) => s.has(x))) return false;
  }
  if (q.typeSlugs?.length && (!doc.document_type || !q.typeSlugs.includes(doc.document_type.slug))) return false;
  if (q.governorateSlugs?.length) {
    const s = new Set(doc.governorates.map((g) => g.slug));
    if (!q.governorateSlugs.some((x) => s.has(x))) return false;
  }
  if (q.languageSlugs?.length && (!doc.language || !q.languageSlugs.includes(doc.language.slug))) return false;
  if (q.organizationSlugs?.length) {
    if (!doc.organization || !q.organizationSlugs.includes(doc.organization.slug)) return false;
  }
  if (q.yearFrom || q.yearTo) {
    const y = Number(doc.date_published?.slice(0, 4) ?? NaN);
    if (!Number.isFinite(y)) return false;
    if (q.yearFrom && y < q.yearFrom) return false;
    if (q.yearTo && y > q.yearTo) return false;
  }
  if (q.dynamicFilters) {
    const source = doc as unknown as Record<string, unknown>;
    for (const [field, accepted] of Object.entries(q.dynamicFilters)) {
      if (!accepted.length) continue;
      const raw = source[field];
      if (raw === undefined || raw === null) return false;
      if (Array.isArray(raw)) {
        const values = raw
          .map((item) => {
            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') return String(item);
            if (item && typeof item === 'object') {
              const obj = item as Record<string, unknown>;
              return typeof obj.slug === 'string' ? obj.slug : typeof obj.id === 'string' ? obj.id : null;
            }
            return null;
          })
          .filter((v): v is string => Boolean(v));
        if (!accepted.some((value) => values.includes(value))) return false;
      } else if (typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        const value = (typeof obj.slug === 'string' && obj.slug) || (typeof obj.id === 'string' && obj.id) || '';
        if (!accepted.includes(value)) return false;
      } else if (!accepted.includes(String(raw))) {
        return false;
      }
    }
  }
  return true;
}

async function searchMock(query: SearchQuery): Promise<SearchResult> {
  const filtered = mockDocuments.filter((d) => matchesFilters(d, query));
  const q = query.q.trim();
  if (!q) {
    const sorted = [...filtered].sort((a, b) =>
      query.listSort === 'oldest'
        ? (a.date_published ?? '').localeCompare(b.date_published ?? '')
        : (b.date_published ?? '').localeCompare(a.date_published ?? ''),
    );
    return {
      total: sorted.length,
      query: '',
      hits: sorted.slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 20)).map((d) => ({
        document: d,
        score: 1,
      })),
    };
  }

  const terms = tokenize(q);
  const queryBigrams = bigrams(q);
  const scored = filtered.map((d) => {
    const haystack = [
      d.title,
      d.author ?? '',
      d.organization?.name ?? '',
      d.abstract_original ?? '',
      ...(Object.values(d.abstract_translations ?? {}) as string[]),
      ...(d.keywords ?? []),
      ...d.themes.map((t) => [t.name_ar, t.name_fr, t.name_en].join(' ')),
    ].join(' ');
    const haystackLower = haystack.toLowerCase();
    const keywordHits = terms.reduce((acc, t) => acc + (haystackLower.includes(t) ? 1 : 0), 0);
    const trigramScore = jaccard(queryBigrams, bigrams(haystack));
    const score = keywordHits * 0.6 + trigramScore * 0.4;
    return {
      document: d,
      highlightedTitle: highlight(d.title, terms, 120),
      highlightedSnippet: highlight(d.abstract_original ?? '', terms, 220),
      score,
    };
  });

  const hits = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const offset = query.offset ?? 0;
  const limit = query.limit ?? 20;
  return {
    hits: hits.slice(offset, offset + limit),
    total: hits.length,
    query: q,
  };
}

/** Maps browse filters to Meilisearch; `listSort` mirrors `DocumentQuery.sort`. */
export function mapDocumentQueryToSearchQuery(query: DocumentQuery): SearchQuery {
  return {
    q: query.q?.trim() ?? '',
    themeSlugs: query.themeSlugs,
    typeSlugs: query.typeSlugs,
    governorateSlugs: query.governorateSlugs,
    languageSlugs: query.languageSlugs,
    organizationSlugs: query.organizationSlugs,
    yearFrom: query.yearFrom,
    yearTo: query.yearTo,
    dynamicFilters: query.dynamicFilters,
    limit: query.limit,
    offset: query.offset,
    listSort: query.sort,
  };
}

/** Paginated published documents via Meilisearch (filters + sort + offset/limit). */
export async function documentSearchToPaginated(query: DocumentQuery): Promise<PaginatedDocuments> {
  const res = await search(mapDocumentQueryToSearchQuery(query));
  return {
    items: res.hits.map((h) => h.document),
    total: res.total,
  };
}
