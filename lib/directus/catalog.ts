/**
 * Per-request cached taxonomy + organization maps for assembling `Document`
 * rows from the simplified JSON shape the seed script writes to Directus.
 */
import { cache } from 'react';

import { isMockMode } from './client';
import { directusListItems } from './http';
import type { DirectusFile, Document, DocumentType, Governorate, Language, Organization, Theme } from '@/types/directus';

export type DirectusCatalog = {
  themes: Map<string, Theme>;
  governorates: Map<string, Governorate>;
  languages: Map<string, Language>;
  documentTypes: Map<string, DocumentType>;
  organizations: Map<string, Organization>;
};

export function parseDirectusFileField(raw: unknown): DirectusFile | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id === 'string' && typeof o.url === 'string') {
    return {
      id: o.id,
      url: o.url,
      filename: typeof o.filename === 'string' ? o.filename : undefined,
      mime_type: typeof o.mime_type === 'string' ? o.mime_type : undefined,
    };
  }
  return null;
}

export function mapDirectusOrganization(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    slug: String(row.slug ?? ''),
    name: String(row.name ?? ''),
    name_ar: typeof row.name_ar === 'string' ? row.name_ar : undefined,
    name_fr: typeof row.name_fr === 'string' ? row.name_fr : undefined,
    name_en: typeof row.name_en === 'string' ? row.name_en : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    description_ar: typeof row.description_ar === 'string' ? row.description_ar : undefined,
    description_fr: typeof row.description_fr === 'string' ? row.description_fr : undefined,
    description_en: typeof row.description_en === 'string' ? row.description_en : undefined,
    website: typeof row.website === 'string' ? row.website : undefined,
    logo: parseDirectusFileField(row.logo),
    contact_email: typeof row.contact_email === 'string' ? row.contact_email : undefined,
    contact_phone: typeof row.contact_phone === 'string' ? row.contact_phone : undefined,
    contact_address: typeof row.contact_address === 'string' ? row.contact_address : undefined,
    is_verified: Boolean(row.is_verified),
    status: (row.status as Organization['status']) ?? 'active',
    date_created: String(row.date_created ?? new Date().toISOString()),
    date_updated: String(row.date_updated ?? new Date().toISOString()),
  };
}

export const getDirectusCatalog = cache(async (): Promise<DirectusCatalog> => {
  if (isMockMode()) {
    throw new Error('getDirectusCatalog must not run in mock mode');
  }
  const [themeRows, govRows, langRows, typeRows, orgRows] = await Promise.all([
    directusListItems<Record<string, unknown>>('themes', { sort: 'sort_order', limit: '500' }),
    directusListItems<Record<string, unknown>>('governorates', { sort: 'sort_order', limit: '500' }),
    directusListItems<Record<string, unknown>>('languages', { sort: 'sort_order', limit: '100' }),
    directusListItems<Record<string, unknown>>('document_types', { sort: 'sort_order', limit: '100' }),
    directusListItems<Record<string, unknown>>('organizations', { sort: 'name', limit: '500' }),
  ]);

  const themes = new Map<string, Theme>();
  for (const r of themeRows) {
    themes.set(String(r.id), {
      id: String(r.id),
      slug: String(r.slug ?? ''),
      name_ar: String(r.name_ar ?? ''),
      name_fr: String(r.name_fr ?? ''),
      name_en: String(r.name_en ?? ''),
      sort_order: typeof r.sort_order === 'number' ? r.sort_order : undefined,
    });
  }
  const governorates = new Map<string, Governorate>();
  for (const r of govRows) {
    governorates.set(String(r.id), {
      id: String(r.id),
      slug: String(r.slug ?? ''),
      name_ar: String(r.name_ar ?? ''),
      name_fr: String(r.name_fr ?? ''),
      name_en: String(r.name_en ?? ''),
      sort_order: typeof r.sort_order === 'number' ? r.sort_order : undefined,
    });
  }
  const languages = new Map<string, Language>();
  for (const r of langRows) {
    languages.set(String(r.id), {
      id: String(r.id),
      slug: String(r.slug ?? ''),
      name_ar: String(r.name_ar ?? ''),
      name_fr: String(r.name_fr ?? ''),
      name_en: String(r.name_en ?? ''),
      sort_order: typeof r.sort_order === 'number' ? r.sort_order : undefined,
    });
  }
  const documentTypes = new Map<string, DocumentType>();
  for (const r of typeRows) {
    documentTypes.set(String(r.id), {
      id: String(r.id),
      slug: String(r.slug ?? ''),
      name_ar: String(r.name_ar ?? ''),
      name_fr: String(r.name_fr ?? ''),
      name_en: String(r.name_en ?? ''),
      sort_order: typeof r.sort_order === 'number' ? r.sort_order : undefined,
    });
  }
  const organizations = new Map<string, Organization>();
  for (const r of orgRows) {
    const o = mapDirectusOrganization(r);
    organizations.set(o.id, o);
  }

  return { themes, governorates, languages, documentTypes, organizations };
});

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter(Boolean);
}

function parseFiles(raw: unknown, documentId: string): Document['files'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const file = o.file;
      if (!file || typeof file !== 'object') return null;
      const f = file as Record<string, unknown>;
      if (typeof f.id !== 'string' || typeof f.url !== 'string') return null;
      const id = typeof o.id === 'string' ? o.id : `file-${documentId}-${idx}`;
      const kind = (o.kind as Document['files'][number]['kind']) ?? 'main';
      return {
        id,
        document: documentId,
        file: {
          id: f.id,
          url: f.url,
          filename: typeof f.filename === 'string' ? f.filename : undefined,
          mime_type: typeof f.mime_type === 'string' ? f.mime_type : undefined,
        },
        kind,
        label_ar: typeof o.label_ar === 'string' ? o.label_ar : undefined,
        label_fr: typeof o.label_fr === 'string' ? o.label_fr : undefined,
        label_en: typeof o.label_en === 'string' ? o.label_en : undefined,
        sort_order: typeof o.sort_order === 'number' ? o.sort_order : undefined,
      };
    })
    .filter(Boolean) as Document['files'];
}

export function mapDirectusDocumentRow(row: Record<string, unknown>, c: DirectusCatalog): Document {
  const id = String(row.id);
  const orgId = row.organization != null ? String(row.organization) : null;
  const themeIds = asStringArray(row.themes);
  const govIds = asStringArray(row.governorates);
  const langId = row.language != null ? String(row.language) : null;
  const typeId = row.document_type != null ? String(row.document_type) : null;

  const themes = themeIds.map((tid) => c.themes.get(tid)).filter(Boolean) as Theme[];
  const governorates = govIds.map((gid) => c.governorates.get(gid)).filter(Boolean) as Governorate[];

  const abstractTranslations =
    row.abstract_translations && typeof row.abstract_translations === 'object'
      ? (row.abstract_translations as Document['abstract_translations'])
      : undefined;

  const keywords = asStringArray(row.keywords);

  return {
    id,
    title: String(row.title ?? ''),
    author: typeof row.author === 'string' ? row.author : undefined,
    organization: orgId ? c.organizations.get(orgId) ?? null : null,
    date_published: typeof row.date_published === 'string' ? row.date_published : null,
    abstract_original: typeof row.abstract_original === 'string' ? row.abstract_original : undefined,
    abstract_translations: abstractTranslations,
    language: langId ? c.languages.get(langId) ?? null : null,
    themes,
    document_type: typeId ? c.documentTypes.get(typeId) ?? null : null,
    governorates,
    keywords,
    supersedes: null,
    superseded_by: null,
    files: parseFiles(row.files, id),
    file_hash: String(row.file_hash ?? ''),
    content_fingerprint: String(row.content_fingerprint ?? ''),
    status: (row.status as Document['status']) ?? 'published',
    date_uploaded: String(row.date_uploaded ?? row.date_created ?? new Date().toISOString()),
    date_created: String(row.date_created ?? new Date().toISOString()),
    date_updated: String(row.date_updated ?? new Date().toISOString()),
  };
}
