/**
 * BibTeX citation formatter. Targets @techreport which is the closest
 * entry type for CSO policy briefs / research reports.
 *
 * Users download the output as a .bib file and import it into Zotero or
 * Mendeley in one click.
 */
import type { Document } from '@/types/directus';
import { absoluteUrl } from '@/lib/utils';

export function formatBibtex(doc: Document): string {
  const key = bibKey(doc);
  const title = escape(doc.title?.trim() || '[Untitled]');
  const author = escape(formatAuthor(doc));
  const year = doc.date_published?.slice(0, 4) ?? '';
  const month = monthName(doc.date_published);
  const institution = escape(doc.organization?.name?.trim() || 'Roufouf');
  const url = absoluteUrl(`/documents/${doc.id}`);
  const keywords = doc.keywords?.length ? escape(doc.keywords.join(', ')) : '';

  const lines: string[] = [
    `@techreport{${key},`,
    `  author = {${author}},`,
    `  title = {${title}},`,
    `  institution = {${institution}},`,
  ];
  if (year) lines.push(`  year = {${year}},`);
  if (month) lines.push(`  month = {${month}},`);
  if (keywords) lines.push(`  keywords = {${keywords}},`);
  lines.push(`  url = {${url}}`);
  lines.push('}');
  return lines.join('\n');
}

function bibKey(doc: Document): string {
  const author = doc.author || doc.organization?.name || 'roufouf';
  const firstAuthor = author.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const year = doc.date_published?.slice(0, 4) ?? 'nd';
  const tail = (doc.title || 'doc')
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${firstAuthor}${year}${tail}`.slice(0, 40) || `roufouf${doc.id}`;
}

function formatAuthor(doc: Document): string {
  if (doc.author && doc.author.trim().length > 0) return doc.author.trim();
  if (doc.organization?.name) return `{${doc.organization.name.trim()}}`;
  return '{Anonymous}';
}

function monthName(dateIso?: string | null): string {
  if (!dateIso) return '';
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const m = Number(dateIso.slice(5, 7));
  return m >= 1 && m <= 12 ? months[m - 1] : '';
}

function escape(s: string): string {
  return s.replace(/([{}])/g, '\\$1');
}
