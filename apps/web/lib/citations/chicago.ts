/**
 * Chicago (author-date / notes-and-bibliography hybrid) citation formatter.
 */
import type { Document } from '@/types/directus';
import { citationUrl } from './url';

export function formatChicago(doc: Document): string {
  const author = formatAuthor(doc);
  const year = doc.date_published?.slice(0, 4) ?? 'n.d.';
  const title = doc.title?.trim() || '[Untitled]';
  const publisher = doc.organization?.name?.trim() || 'Roufouf';
  const url = citationUrl(doc);
  return `${author}. ${year}. *${title}*. ${publisher}. ${url}.`;
}

function formatAuthor(doc: Document): string {
  if (doc.author && doc.author.trim().length > 0) {
    const parts = doc.author.trim().split(/\s+/);
    if (parts.length < 2) return doc.author.trim();
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(' ');
    return `${last}, ${first}`;
  }
  if (doc.organization?.name) return doc.organization.name.trim();
  return '[Anonymous]';
}
