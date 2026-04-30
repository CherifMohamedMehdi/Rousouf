/**
 * Mock taxonomies. These match docs/SCHEMA.md §4 exactly.
 *
 * When Directus is wired in, lib/directus/taxonomies.ts will fetch the real
 * rows instead of importing these. Nothing else in the app should change.
 */
import type { DocumentType, Governorate, Language, Theme } from '@/types/directus';

export const mockThemes: Theme[] = [
  { id: 't-governance', slug: 'governance', name_ar: 'الحوكمة', name_fr: 'Gouvernance', name_en: 'Governance', sort_order: 1 },
  { id: 't-human-rights', slug: 'human-rights', name_ar: 'حقوق الإنسان', name_fr: 'Droits humains', name_en: 'Human Rights', sort_order: 2 },
  { id: 't-gender', slug: 'gender', name_ar: 'النوع الاجتماعي', name_fr: 'Genre', name_en: 'Gender', sort_order: 3 },
  { id: 't-environment', slug: 'environment', name_ar: 'البيئة', name_fr: 'Environnement', name_en: 'Environment', sort_order: 4 },
  { id: 't-media', slug: 'media', name_ar: 'الإعلام', name_fr: 'Médias', name_en: 'Media', sort_order: 5 },
  { id: 't-economy', slug: 'economy', name_ar: 'الاقتصاد', name_fr: 'Économie', name_en: 'Economy', sort_order: 6 },
  { id: 't-education', slug: 'education', name_ar: 'التعليم', name_fr: 'Éducation', name_en: 'Education', sort_order: 7 },
  { id: 't-migration', slug: 'migration', name_ar: 'الهجرة', name_fr: 'Migration', name_en: 'Migration', sort_order: 8 },
];

export const mockDocumentTypes: DocumentType[] = [
  { id: 'dt-policy-brief', slug: 'policy-brief', name_ar: 'موجز سياسات', name_fr: 'Note de politique', name_en: 'Policy Brief', sort_order: 1 },
  { id: 'dt-research-report', slug: 'research-report', name_ar: 'تقرير بحثي', name_fr: 'Rapport de recherche', name_en: 'Research Report', sort_order: 2 },
  { id: 'dt-monitoring-study', slug: 'monitoring-study', name_ar: 'دراسة رصد', name_fr: 'Étude de suivi', name_en: 'Monitoring Study', sort_order: 3 },
  { id: 'dt-survey', slug: 'survey', name_ar: 'استطلاع', name_fr: 'Enquête', name_en: 'Survey', sort_order: 4 },
];

export const mockLanguages: Language[] = [
  { id: 'lang-ar', slug: 'ar', name_ar: 'العربية', name_fr: 'Arabe', name_en: 'Arabic', sort_order: 1 },
  { id: 'lang-fr', slug: 'fr', name_ar: 'الفرنسية', name_fr: 'Français', name_en: 'French', sort_order: 2 },
  { id: 'lang-en', slug: 'en', name_ar: 'الإنجليزية', name_fr: 'Anglais', name_en: 'English', sort_order: 3 },
  { id: 'lang-es', slug: 'es', name_ar: 'الإسبانية', name_fr: 'Espagnol', name_en: 'Spanish', sort_order: 4 },
  { id: 'lang-it', slug: 'it', name_ar: 'الإيطالية', name_fr: 'Italien', name_en: 'Italian', sort_order: 5 },
  { id: 'lang-de', slug: 'de', name_ar: 'الألمانية', name_fr: 'Allemand', name_en: 'German', sort_order: 6 },
  { id: 'lang-tr', slug: 'tr', name_ar: 'التركية', name_fr: 'Turc', name_en: 'Turkish', sort_order: 7 },
  { id: 'lang-pt', slug: 'pt', name_ar: 'البرتغالية', name_fr: 'Portugais', name_en: 'Portuguese', sort_order: 8 },
  { id: 'lang-ru', slug: 'ru', name_ar: 'الروسية', name_fr: 'Russe', name_en: 'Russian', sort_order: 9 },
  { id: 'lang-zh', slug: 'zh', name_ar: 'الصينية', name_fr: 'Chinois', name_en: 'Chinese', sort_order: 10 },
  { id: 'lang-other', slug: 'other', name_ar: 'أخرى', name_fr: 'Autre', name_en: 'Other', sort_order: 11 },
];

export const mockGovernorates: Governorate[] = [
  { id: 'g-ariana', slug: 'ariana', name_ar: 'أريانة', name_fr: 'Ariana', name_en: 'Ariana' },
  { id: 'g-beja', slug: 'beja', name_ar: 'باجة', name_fr: 'Béja', name_en: 'Beja' },
  { id: 'g-ben-arous', slug: 'ben-arous', name_ar: 'بن عروس', name_fr: 'Ben Arous', name_en: 'Ben Arous' },
  { id: 'g-bizerte', slug: 'bizerte', name_ar: 'بنزرت', name_fr: 'Bizerte', name_en: 'Bizerte' },
  { id: 'g-gabes', slug: 'gabes', name_ar: 'قابس', name_fr: 'Gabès', name_en: 'Gabes' },
  { id: 'g-gafsa', slug: 'gafsa', name_ar: 'قفصة', name_fr: 'Gafsa', name_en: 'Gafsa' },
  { id: 'g-jendouba', slug: 'jendouba', name_ar: 'جندوبة', name_fr: 'Jendouba', name_en: 'Jendouba' },
  { id: 'g-kairouan', slug: 'kairouan', name_ar: 'القيروان', name_fr: 'Kairouan', name_en: 'Kairouan' },
  { id: 'g-kasserine', slug: 'kasserine', name_ar: 'القصرين', name_fr: 'Kasserine', name_en: 'Kasserine' },
  { id: 'g-kebili', slug: 'kebili', name_ar: 'قبلي', name_fr: 'Kébili', name_en: 'Kebili' },
  { id: 'g-kef', slug: 'kef', name_ar: 'الكاف', name_fr: 'Le Kef', name_en: 'Kef' },
  { id: 'g-mahdia', slug: 'mahdia', name_ar: 'المهدية', name_fr: 'Mahdia', name_en: 'Mahdia' },
  { id: 'g-manouba', slug: 'manouba', name_ar: 'منوبة', name_fr: 'La Manouba', name_en: 'Manouba' },
  { id: 'g-medenine', slug: 'medenine', name_ar: 'مدنين', name_fr: 'Médenine', name_en: 'Medenine' },
  { id: 'g-monastir', slug: 'monastir', name_ar: 'المنستير', name_fr: 'Monastir', name_en: 'Monastir' },
  { id: 'g-nabeul', slug: 'nabeul', name_ar: 'نابل', name_fr: 'Nabeul', name_en: 'Nabeul' },
  { id: 'g-sfax', slug: 'sfax', name_ar: 'صفاقس', name_fr: 'Sfax', name_en: 'Sfax' },
  { id: 'g-sidi-bouzid', slug: 'sidi-bouzid', name_ar: 'سيدي بوزيد', name_fr: 'Sidi Bouzid', name_en: 'Sidi Bouzid' },
  { id: 'g-siliana', slug: 'siliana', name_ar: 'سليانة', name_fr: 'Siliana', name_en: 'Siliana' },
  { id: 'g-sousse', slug: 'sousse', name_ar: 'سوسة', name_fr: 'Sousse', name_en: 'Sousse' },
  { id: 'g-tataouine', slug: 'tataouine', name_ar: 'تطاوين', name_fr: 'Tataouine', name_en: 'Tataouine' },
  { id: 'g-tozeur', slug: 'tozeur', name_ar: 'توزر', name_fr: 'Tozeur', name_en: 'Tozeur' },
  { id: 'g-tunis', slug: 'tunis', name_ar: 'تونس', name_fr: 'Tunis', name_en: 'Tunis' },
  { id: 'g-zaghouan', slug: 'zaghouan', name_ar: 'زغوان', name_fr: 'Zaghouan', name_en: 'Zaghouan' },
];
