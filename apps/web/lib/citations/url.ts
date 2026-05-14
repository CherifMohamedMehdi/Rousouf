import type { Document } from '@/types/directus';
import { absoluteUrl } from '@/lib/utils';

export function citationUrl(doc: Document): string {
  if (doc.zenodo_doi?.trim()) return `https://doi.org/${doc.zenodo_doi.trim()}`;
  return absoluteUrl(`/documents/${doc.id}`);
}
