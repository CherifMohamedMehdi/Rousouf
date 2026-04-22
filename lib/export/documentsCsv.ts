import type { Document } from '@/types/directus';

interface ExportRow {
  id: string;
  title: string;
  author: string;
  status: string;
  date_published: string;
  date_uploaded: string;
  organization_id: string;
  organization_slug: string;
  organization_name: string;
  language_slug: string;
  language_name: string;
  document_type_slug: string;
  document_type_name: string;
  themes_slugs: string;
  themes_names: string;
  governorates_slugs: string;
  governorates_names: string;
  keywords: string;
}

function escapeCsv(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function joinList(values: string[]): string {
  return values.join(' | ');
}

export function toExportRows(documents: Document[]): ExportRow[] {
  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    author: doc.author ?? '',
    status: doc.status,
    date_published: doc.date_published ?? '',
    date_uploaded: doc.date_uploaded ?? '',
    organization_id: doc.organization?.id ?? '',
    organization_slug: doc.organization?.slug ?? '',
    organization_name: doc.organization?.name ?? '',
    language_slug: doc.language?.slug ?? '',
    language_name: doc.language?.name_en ?? '',
    document_type_slug: doc.document_type?.slug ?? '',
    document_type_name: doc.document_type?.name_en ?? '',
    themes_slugs: joinList(doc.themes.map((item) => item.slug)),
    themes_names: joinList(doc.themes.map((item) => item.name_en)),
    governorates_slugs: joinList(doc.governorates.map((item) => item.slug)),
    governorates_names: joinList(doc.governorates.map((item) => item.name_en)),
    keywords: joinList(doc.keywords ?? []),
  }));
}

export function toDocumentsCsv(documents: Document[]): string {
  const rows = toExportRows(documents);
  const headers: (keyof ExportRow)[] = [
    'id',
    'title',
    'author',
    'status',
    'date_published',
    'date_uploaded',
    'organization_id',
    'organization_slug',
    'organization_name',
    'language_slug',
    'language_name',
    'document_type_slug',
    'document_type_name',
    'themes_slugs',
    'themes_names',
    'governorates_slugs',
    'governorates_names',
    'keywords',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((key) => escapeCsv(String(row[key] ?? ''))).join(','));
  }
  return lines.join('\n');
}

