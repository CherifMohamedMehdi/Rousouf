/**
 * Returns a function that reads the localized label of a taxonomy term
 * based on the currently-active UI locale.
 *
 * Usage:
 *   const label = useTaxonomyLabel();
 *   <span>{label(theme)}</span>
 *
 * Falls back through ar → fr → en → name/slug so missing translations never
 * produce a blank label.
 */
'use client';

import { useLocale } from 'next-intl';
import type { TaxonomyTerm } from '@/types/directus';
import type { Locale } from '@/lib/i18n/config';

type HasLocalizedNames = Partial<Pick<TaxonomyTerm, 'name_ar' | 'name_fr' | 'name_en' | 'slug'>> & {
  name?: string;
};

export function useTaxonomyLabel() {
  const locale = useLocale() as Locale;
  return (term: HasLocalizedNames | null | undefined): string => pickLabel(term, locale);
}

export function pickLabel(term: HasLocalizedNames | null | undefined, locale: Locale): string {
  if (!term) return '';
  const key = `name_${locale}` as keyof HasLocalizedNames;
  const primary = term[key];
  if (typeof primary === 'string' && primary.length > 0) return primary;
  return (
    term.name_en ||
    term.name_fr ||
    term.name_ar ||
    term.name ||
    term.slug ||
    ''
  );
}
