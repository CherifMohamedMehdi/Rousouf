/**
 * Server-safe helper to pick a localized taxonomy label. Mirror of the
 * useTaxonomyLabel() hook, but callable from server components.
 */
import type { LocalizedText, TaxonomyTerm } from '@/types/directus';
import { locales, type Locale } from './config';

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

/** Public org blurb for the active locale (falls back to generic `description`). */
export function pickLocalizedDescription(
  org: {
    description?: string;
    description_ar?: string;
    description_fr?: string;
    description_en?: string;
  },
  locale: Locale,
): string {
  const key = `description_${locale}` as const;
  const primary = org[key];
  if (typeof primary === 'string' && primary.trim()) return primary;
  return org.description ?? org.description_en ?? org.description_fr ?? org.description_ar ?? '';
}

/**
 * Maps the visible abstract to a Directus field name + raw value for suggestions.
 * `abstract_translations` is one JSON column; we store the locale slice string as current_value.
 */
export function suggestableAbstractField(
  doc: { abstract_original?: string; abstract_translations?: LocalizedText },
  locale: Locale,
): { fieldName: string; currentValue: string } {
  const displayed = pickLocalizedAbstract(doc, locale);
  const t = doc.abstract_translations ?? {};
  const locSlice = (t as Record<string, string | undefined>)[locale]?.trim();
  if (locSlice) return { fieldName: 'abstract_translations', currentValue: (t as Record<string, string | undefined>)[locale] ?? '' };
  const orig = (doc.abstract_original ?? '').trim();
  if (orig && displayed.trim() === orig) return { fieldName: 'abstract_original', currentValue: doc.abstract_original ?? '' };
  for (const L of locales) {
    const s = (t as Record<string, string | undefined>)[L]?.trim();
    if (s && displayed.trim() === s) return { fieldName: 'abstract_translations', currentValue: s };
  }
  return { fieldName: 'abstract_original', currentValue: displayed };
}

/** Maps visible org description to a Directus field for suggestions. */
export function suggestableOrganizationDescriptionField(
  org: {
    description?: string;
    description_ar?: string;
    description_fr?: string;
    description_en?: string;
  },
  locale: Locale,
): { fieldName: string; currentValue: string } {
  const displayed = pickLocalizedDescription(org, locale);
  const key = `description_${locale}` as const;
  const slice = org[key];
  if (typeof slice === 'string' && slice.trim()) return { fieldName: key, currentValue: slice };
  const base = (org.description ?? '').trim();
  if (base && displayed.trim() === base) return { fieldName: 'description', currentValue: org.description ?? '' };
  for (const L of locales) {
    const k = `description_${L}` as const;
    const s = org[k];
    if (typeof s === 'string' && s.trim() && displayed.trim() === s.trim()) return { fieldName: k, currentValue: s };
  }
  return { fieldName: 'description', currentValue: displayed };
}
