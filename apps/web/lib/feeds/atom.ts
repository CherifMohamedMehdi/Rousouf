/**
 * Minimal Atom feed builder.
 *
 * Dependency-free so it works at the edge. Takes a list of documents and
 * renders a valid application/atom+xml document.
 */
import type { Document } from '@/types/directus';
import type { Locale } from '@/lib/i18n/config';
import { absoluteUrl } from '@/lib/utils';
import { pickLocalizedAbstract } from '@/lib/i18n/taxonomy';

export interface AtomFeedInput {
  id: string; // absolute URL identifying the feed
  title: string;
  selfUrl: string;
  htmlUrl: string;
  locale: Locale;
  documents: Document[];
  updated?: string; // ISO date
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderAtomFeed(input: AtomFeedInput): string {
  const updated = input.updated ?? input.documents[0]?.date_updated ?? new Date().toISOString();
  const entries = input.documents
    .map((doc) => {
      const url = absoluteUrl(`/${input.locale}/documents/${doc.id}`);
      const abstract = pickLocalizedAbstract(doc, input.locale);
      return [
        '  <entry>',
        `    <title>${escapeXml(doc.title)}</title>`,
        `    <id>${escapeXml(url)}</id>`,
        `    <link rel="alternate" type="text/html" href="${escapeXml(url)}" />`,
        `    <updated>${escapeXml(doc.date_updated ?? doc.date_created ?? new Date().toISOString())}</updated>`,
        doc.date_published ? `    <published>${escapeXml(doc.date_published)}T00:00:00Z</published>` : '',
        doc.organization?.name
          ? `    <author><name>${escapeXml(doc.organization.name)}</name></author>`
          : '',
        abstract ? `    <summary type="text">${escapeXml(abstract)}</summary>` : '',
        '  </entry>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${escapeXml(input.title)}</title>`,
    `  <id>${escapeXml(input.id)}</id>`,
    `  <link rel="self" href="${escapeXml(input.selfUrl)}" />`,
    `  <link rel="alternate" type="text/html" href="${escapeXml(input.htmlUrl)}" />`,
    `  <updated>${escapeXml(updated)}</updated>`,
    entries,
    '</feed>',
    '',
  ].join('\n');
}
