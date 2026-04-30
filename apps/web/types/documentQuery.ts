/**
 * Shared browse / list query types for Directus and Meilisearch paths.
 * Lives in `types/` so search code does not import `lib/directus/documents` for types only.
 */
import type { Document } from '@/types/directus';

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
  /** Plain-text filter (mock / legacy path only; Meilisearch browse uses `search()`). */
  q?: string;
  excludeId?: string;
  dynamicFilters?: Record<string, string[]>;
}

export interface PaginatedDocuments {
  items: Document[];
  total: number;
}
