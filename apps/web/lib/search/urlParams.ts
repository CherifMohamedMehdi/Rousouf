/**
 * URL <-> SearchQuery helpers.
 *
 * The search page is entirely URL-driven: every filter, the query, sort,
 * and page are encoded as query-string params. This file is the single
 * place that knows the param names, so both the server page and the
 * client-side FilterSidebar stay in sync.
 *
 * Multi-value filters use repeated params: ?themes=a&themes=b. Year range
 * uses `yearFrom`/`yearTo`. Sort uses `sort=recent|oldest|relevant`.
 */
import type { SearchQuery } from './meilisearch';

export type SortMode = 'recent' | 'oldest' | 'relevant';

export interface ParsedSearchParams extends SearchQuery {
  sort: SortMode;
  page: number;
  pageSize: number;
  dynamicFilters: Record<string, string[]>;
}

export const PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const RESERVED_PARAM_KEYS = new Set([
  'q',
  'themes',
  'types',
  'governorates',
  'languages',
  'orgs',
  'yearFrom',
  'yearTo',
  'sort',
  'page',
  'limit',
]);

export function parseSearchParams(sp: Record<string, string | string[] | undefined>): ParsedSearchParams {
  const listOf = (key: string): string[] => {
    const raw = sp[key];
    if (!raw) return [];
    return Array.isArray(raw) ? raw.filter(Boolean) : [raw].filter(Boolean);
  };
  const num = (key: string): number | undefined => {
    const v = typeof sp[key] === 'string' ? Number(sp[key]) : undefined;
    return Number.isFinite(v) ? (v as number) : undefined;
  };

  const sort = (typeof sp.sort === 'string' ? sp.sort : 'recent') as SortMode;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const requestedLimit = Number(typeof sp.limit === 'string' ? sp.limit : PAGE_SIZE);
  const pageSize = PAGE_SIZE_OPTIONS.includes(requestedLimit as (typeof PAGE_SIZE_OPTIONS)[number])
    ? requestedLimit
    : PAGE_SIZE;

  const dynamicFilters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (RESERVED_PARAM_KEYS.has(key)) continue;
    const values = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
    if (values.length) dynamicFilters[key] = values;
  }

  return {
    q: typeof sp.q === 'string' ? sp.q : '',
    themeSlugs: listOf('themes'),
    typeSlugs: listOf('types'),
    governorateSlugs: listOf('governorates'),
    languageSlugs: listOf('languages'),
    organizationSlugs: listOf('orgs'),
    yearFrom: num('yearFrom'),
    yearTo: num('yearTo'),
    limit: pageSize,
    offset: (page - 1) * pageSize,
    pageSize,
    dynamicFilters,
    sort: ['recent', 'oldest', 'relevant'].includes(sort) ? sort : 'recent',
    page,
  };
}

export interface ActiveFilter {
  group: 'themes' | 'types' | 'governorates' | 'languages' | 'orgs' | 'yearFrom' | 'yearTo' | 'q';
  value: string;
  label: string;
}

export function buildQueryString(params: URLSearchParams, patch: Record<string, string | string[] | undefined>): string {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(patch)) {
    next.delete(key);
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v) next.append(key, v);
    } else if (value) {
      next.set(key, value);
    }
  }
  return next.toString();
}

export function toggleParam(params: URLSearchParams, key: string, value: string): string {
  const next = new URLSearchParams(params.toString());
  const existing = next.getAll(key);
  if (existing.includes(value)) {
    next.delete(key);
    for (const v of existing) if (v !== value) next.append(key, v);
  } else {
    next.append(key, value);
  }
  next.delete('page');
  return next.toString();
}

export function removeParam(params: URLSearchParams, key: string, value?: string): string {
  const next = new URLSearchParams(params.toString());
  if (value === undefined) {
    next.delete(key);
  } else {
    const existing = next.getAll(key);
    next.delete(key);
    for (const v of existing) if (v !== value) next.append(key, v);
  }
  next.delete('page');
  return next.toString();
}
