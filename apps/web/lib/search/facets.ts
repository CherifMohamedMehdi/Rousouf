import type { Document } from '@/types/directus';
import type { Locale } from '@/lib/i18n/config';

export interface SearchFacetOption {
  value: string;
  label: string;
}

export interface SearchFacet {
  key: string;
  paramKey: string;
  label: string;
  options: SearchFacetOption[];
  sourceField: string;
}

const EXCLUDED_FIELDS = new Set([
  'id',
  'title',
  'author',
  'abstract_original',
  'abstract_translations',
  'files',
  'file_hash',
  'content_fingerprint',
  'date_uploaded',
  'date_created',
  'date_updated',
  'date_published',
  'status',
  'supersedes',
  'superseded_by',
  'source_url',
]);

const RESERVED_PARAM_KEYS = new Set(['themes', 'types', 'orgs', 'governorates', 'languages']);

function sentenceCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (m) => m.toUpperCase());
}

function localizeNamedEntity(value: Record<string, unknown>, locale: Locale): string {
  const localized = value[`name_${locale}`];
  if (typeof localized === 'string' && localized.trim()) return localized;
  if (typeof value.name_en === 'string' && value.name_en.trim()) return value.name_en;
  if (typeof value.name_fr === 'string' && value.name_fr.trim()) return value.name_fr;
  if (typeof value.name_ar === 'string' && value.name_ar.trim()) return value.name_ar;
  if (typeof value.name === 'string' && value.name.trim()) return value.name;
  if (typeof value.slug === 'string' && value.slug.trim()) return value.slug;
  return '';
}

function normalizePrimitive(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function normalizeOptionFromObject(value: Record<string, unknown>, locale: Locale): SearchFacetOption | null {
  const raw =
    (typeof value.slug === 'string' && value.slug) ||
    (typeof value.id === 'string' && value.id) ||
    normalizePrimitive(value.value);
  if (!raw) return null;
  const label = localizeNamedEntity(value, locale) || sentenceCase(raw);
  return { value: raw, label };
}

function normalizeOption(value: unknown, locale: Locale): SearchFacetOption | null {
  const primitive = normalizePrimitive(value);
  if (primitive) return { value: primitive, label: sentenceCase(primitive) };
  if (value && typeof value === 'object') return normalizeOptionFromObject(value as Record<string, unknown>, locale);
  return null;
}

function buildFacetFromField(
  field: string,
  docs: Document[],
  locale: Locale,
): SearchFacet | null {
  if (EXCLUDED_FIELDS.has(field)) return null;
  const opts = new Map<string, string>();
  for (const doc of docs) {
    const value = (doc as unknown as Record<string, unknown>)[field];
    if (Array.isArray(value)) {
      for (const item of value) {
        const normalized = normalizeOption(item, locale);
        if (normalized) opts.set(normalized.value, normalized.label);
      }
      continue;
    }
    const normalized = normalizeOption(value, locale);
    if (normalized) opts.set(normalized.value, normalized.label);
  }

  if (opts.size < 2) return null;
  const paramKey = field.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (RESERVED_PARAM_KEYS.has(paramKey)) return null;
  return {
    key: field,
    paramKey,
    label: sentenceCase(field),
    sourceField: field,
    options: [...opts.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export function inferDynamicFacetsFromDocuments(docs: Document[], locale: Locale): SearchFacet[] {
  if (!docs.length) return [];
  const firstDoc = docs[0] as unknown as Record<string, unknown>;
  const fields = Object.keys(firstDoc);
  return fields
    .map((field) => buildFacetFromField(field, docs, locale))
    .filter((facet): facet is SearchFacet => Boolean(facet));
}

