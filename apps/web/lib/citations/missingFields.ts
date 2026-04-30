/**
 * Determines which citation-relevant fields are missing from a document so
 * the UI can show "suggest edit" links for each specifically.
 */
import type { Document } from '@/types/directus';

export type CitationFieldKey =
  | 'author'
  | 'date_published'
  | 'organization'
  | 'title';

export interface MissingField {
  key: CitationFieldKey;
  label: Record<'ar' | 'fr' | 'en', string>;
}

const LABELS: Record<CitationFieldKey, Record<'ar' | 'fr' | 'en', string>> = {
  author: { ar: 'المؤلف', fr: 'auteur', en: 'author' },
  date_published: { ar: 'تاريخ النشر', fr: 'date de publication', en: 'publication date' },
  organization: { ar: 'المنظمة', fr: 'organisation', en: 'organization' },
  title: { ar: 'العنوان', fr: 'titre', en: 'title' },
};

export function getCitationMissingFields(doc: Document): MissingField[] {
  const missing: MissingField[] = [];
  if (!doc.title) missing.push({ key: 'title', label: LABELS.title });
  if (!doc.author && !doc.organization) {
    missing.push({ key: 'author', label: LABELS.author });
  }
  if (!doc.date_published) missing.push({ key: 'date_published', label: LABELS.date_published });
  if (!doc.organization) missing.push({ key: 'organization', label: LABELS.organization });
  return missing;
}
