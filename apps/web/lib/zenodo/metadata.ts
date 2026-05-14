import type { Document } from '@/types/directus';
import { pickLocalizedAbstract } from '@/lib/i18n/taxonomy';

type ZenodoCreator = {
  name: string;
  affiliation?: string;
};

export type ZenodoMetadataPayload = {
  upload_type: 'publication';
  publication_type: 'report';
  publication_date: string;
  title: string;
  creators: ZenodoCreator[];
  description: string;
  access_right: 'open';
  license: string;
  keywords?: string[];
  language?: string;
  communities?: Array<{ identifier: string }>;
  related_identifiers?: Array<{
    identifier: string;
    relation: 'isAlternateIdentifier';
    resource_type: 'publication-report';
  }>;
};

const LANGUAGE_TO_ISO_639_3: Record<string, string> = {
  ar: 'ara',
  fr: 'fra',
  en: 'eng',
  es: 'spa',
  it: 'ita',
  de: 'deu',
  tr: 'tur',
  pt: 'por',
  ru: 'rus',
  zh: 'zho',
};

export function buildZenodoMetadata(doc: Document): ZenodoMetadataPayload {
  const creatorName = doc.author?.trim() || doc.organization?.name?.trim() || 'Roufouf';
  const creator: ZenodoCreator = { name: creatorName };
  if (doc.organization?.name && doc.author?.trim()) creator.affiliation = doc.organization.name;

  const description = pickLocalizedAbstract(doc, 'en') || doc.abstract_original || doc.title;
  const language = doc.language?.slug ? LANGUAGE_TO_ISO_639_3[doc.language.slug] : undefined;
  const community = process.env.ZENODO_COMMUNITY?.trim();
  const sourceUrl = doc.source_url?.trim();

  return {
    upload_type: 'publication',
    publication_type: 'report',
    publication_date: doc.date_published ?? new Date().toISOString().slice(0, 10),
    title: doc.title || 'Untitled document',
    creators: [creator],
    description,
    access_right: 'open',
    license: process.env.ZENODO_DEFAULT_LICENSE?.trim() || 'cc-by-4.0',
    keywords: doc.keywords?.length ? doc.keywords : undefined,
    language,
    communities: community ? [{ identifier: community }] : undefined,
    related_identifiers: sourceUrl
      ? [
          {
            identifier: sourceUrl,
            relation: 'isAlternateIdentifier',
            resource_type: 'publication-report',
          },
        ]
      : undefined,
  };
}

export function zenodoMetadataHash(doc: Document): string {
  return stableHash(JSON.stringify(buildZenodoMetadata(doc)));
}

function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
