/**
 * Meilisearch index configuration for the `documents` index.
 *
 * This file is the source of truth for searchable/filterable/sortable
 * attributes plus Arabic/French/English synonyms and stop-words. In
 * production, a deploy script pushes this config to the Meilisearch
 * instance so it is versioned alongside the code.
 *
 * To add a synonym, drop a new entry in `synonyms`. To tune Arabic search
 * quality, extend `stopWords`.
 */

export const searchableAttributes = [
  'title',
  'abstract_original',
  'abstract_translations.ar',
  'abstract_translations.fr',
  'abstract_translations.en',
  'keywords',
  'author',
  'organization.name',
];

export const filterableAttributes = [
  'themes.id',
  'themes.slug',
  'document_type.id',
  'document_type.slug',
  'governorates.id',
  'governorates.slug',
  'language.id',
  'language.slug',
  'organization.id',
  'organization.slug',
  'date_published',
  'status',
];

export const sortableAttributes = ['date_published', 'date_uploaded'];

/**
 * Multilingual synonym map. Each group is rendered as bidirectional synonyms
 * (every term in the group is a synonym for every other term in the group).
 */
export const synonyms: Record<string, string[]> = {
  'human rights': ['حقوق الإنسان', 'droits humains', 'droits de l\'homme'],
  'حقوق الإنسان': ['human rights', 'droits humains'],
  'droits humains': ['human rights', 'حقوق الإنسان'],
  governance: ['حوكمة', 'gouvernance'],
  'حوكمة': ['governance', 'gouvernance'],
  gouvernance: ['governance', 'حوكمة'],
  gender: ['نوع اجتماعي', 'جندر', 'genre'],
  'نوع اجتماعي': ['gender', 'genre'],
  genre: ['gender', 'نوع اجتماعي'],
  election: ['elections', 'انتخابات', 'élection', 'élections'],
  انتخابات: ['elections', 'élections'],
  élections: ['elections', 'انتخابات'],
  environment: ['بيئة', 'environnement'],
  'بيئة': ['environment', 'environnement'],
  environnement: ['environment', 'بيئة'],
  media: ['إعلام', 'médias', 'medias'],
  إعلام: ['media', 'médias'],
  médias: ['media', 'إعلام'],
  justice: ['عدالة', 'قضاء'],
  عدالة: ['justice'],
  قضاء: ['justice'],
  parliament: ['parlement', 'برلمان', 'مجلس نواب'],
  برلمان: ['parliament', 'parlement'],
  parlement: ['parliament', 'برلمان'],
};

export const stopWords = [
  // Arabic common stop-words
  'في',
  'من',
  'إلى',
  'على',
  'عن',
  'ما',
  'لا',
  'هذا',
  'هذه',
  'ذلك',
  'تلك',
  'مع',
  'بين',
  'كما',
  'و',
  'أو',
  'ثم',
  'أن',
  'إن',
  'قد',
  'هو',
  'هي',
  'هم',
  'كان',
  // French common stop-words
  'le',
  'la',
  'les',
  'un',
  'une',
  'des',
  'du',
  'de',
  'et',
  'à',
  'en',
  'au',
  'aux',
  'pour',
  'par',
  'sur',
  'dans',
  'avec',
  'sans',
  'ou',
  'mais',
  // English common stop-words
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'is',
  'are',
  'was',
  'were',
];

export const meilisearchIndexSettings = {
  searchableAttributes,
  filterableAttributes,
  sortableAttributes,
  synonyms,
  stopWords,
};
