/**
 * APA 7th-edition citation formatter.
 *
 * Handles missing fields gracefully:
 * - Missing date → "n.d."
 * - Missing individual author → falls back to organization as group author
 * - Missing publisher → uses the platform URL
 */
import type { Document } from '@/types/directus';
import { citationUrl } from './url';

export function formatApa(doc: Document): string {
  const author = formatAuthor(doc);
  const year = formatYear(doc.date_published);
  const title = doc.title?.trim() || '[Untitled]';
  const publisher = doc.organization?.name?.trim() || 'Roufouf';
  const url = citationUrl(doc);
  return `${author} (${year}). *${title}*. ${publisher}. ${url}`;
}

function formatAuthor(doc: Document): string {
  if (doc.author && doc.author.trim().length > 0) {
    return apaAuthorName(doc.author.trim());
  }
  if (doc.organization?.name) return doc.organization.name.trim();
  return '[Anonymous]';
}

function apaAuthorName(fullName: string): string {
  const parts = fullName.split(/\s+/);
  if (parts.length < 2) return fullName;
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(' ');
  return `${last}, ${initials}`;
}

function formatYear(dateIso?: string | null): string {
  if (!dateIso) return 'n.d.';
  return dateIso.slice(0, 4);
}
