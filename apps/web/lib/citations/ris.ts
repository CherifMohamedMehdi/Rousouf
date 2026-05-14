/**
 * RIS citation formatter. Uses the RPRT reference type (report) which most
 * reference managers recognize for policy briefs / research reports.
 */
import type { Document } from '@/types/directus';
import { citationUrl } from './url';

export function formatRis(doc: Document): string {
  const lines: string[] = ['TY  - RPRT'];
  if (doc.title) lines.push(`TI  - ${doc.title}`);
  if (doc.author) {
    lines.push(`AU  - ${doc.author}`);
  } else if (doc.organization?.name) {
    lines.push(`AU  - ${doc.organization.name}`);
  }
  if (doc.organization?.name) lines.push(`PB  - ${doc.organization.name}`);
  if (doc.date_published) {
    const [y, m, d] = doc.date_published.split('-');
    lines.push(`PY  - ${y}`);
    lines.push(`DA  - ${y}/${m}/${d}`);
  }
  if (doc.language?.name_en) lines.push(`LA  - ${doc.language.name_en}`);
  for (const kw of doc.keywords ?? []) lines.push(`KW  - ${kw}`);
  if (doc.zenodo_doi) lines.push(`DO  - ${doc.zenodo_doi}`);
  lines.push(`UR  - ${citationUrl(doc)}`);
  lines.push('ER  - ');
  return lines.join('\n');
}
