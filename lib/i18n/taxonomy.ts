/**
 * Server-safe helper to pick a localized taxonomy label. Mirror of the
 * useTaxonomyLabel() hook, but callable from server components.
 */
import type { TaxonomyTerm } from '@/types/directus';
import type { Locale } from './config';

type HasLocalizedNames = Partial<Pick<TaxonomyTerm, 'name_ar' | 'name_fr' | 'name_en' | 'slug'>> & {
  name?: string;
};

export function pickLabel(term: HasLocalizedNames | null | undefined, locale: Locale): string {
  if (!term) return '';
  const key = `name_${locale}` as keyof HasLocalizedNames;
  const primary = term[key];
  if (typeof primary === 'string' && primary.length > 0) return primary;
  return term.name_en || term.name_fr || term.name_ar || term.name || term.slug || '';
}

export function pickLocalizedName<T extends { name?: string; name_ar?: string; name_fr?: string; name_en?: string }>(
  entity: T | null | undefined,
  locale: Locale,
): string {
  if (!entity) return '';
  const key = `name_${locale}` as keyof T;
  const primary = entity[key];
  if (typeof primary === 'string' && primary.length > 0) return primary;
  return entity.name_en || entity.name_fr || entity.name_ar || entity.name || '';
}

export function pickLocalizedAbstract(
  doc: { abstract_translations?: { ar?: string; fr?: string; en?: string; other?: string }; abstract_original?: string },
  locale: Locale,
): string {
  const t = doc.abstract_translations ?? {};
  return (t as Record<string, string | undefined>)[locale] || doc.abstract_original || t.en || t.fr || t.ar || '';
}
