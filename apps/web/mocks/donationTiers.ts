/**
 * Mock donation tiers. Matches docs/SCHEMA.md §7.2.
 *
 * Admins can add / remove / reorder tiers in Directus without any code
 * changes — the Donate page reads this list dynamically.
 */
import type { DonationTier } from '@/types/directus';

export const mockDonationTiers: DonationTier[] = [
  {
    id: 'tier-seed',
    amount_tnd: 30,
    amount_usd: 10,
    amount_eur: 9,
    label_ar: 'بذرة',
    label_fr: 'Graine',
    label_en: 'Seed',
    impact_ar: 'يمول أرشفة وثيقة واحدة بكامل بياناتها.',
    impact_fr: 'Finance l\'archivage complet d\'un document.',
    impact_en: 'Funds the full archiving of one document.',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'tier-branch',
    amount_tnd: 100,
    amount_usd: 30,
    amount_eur: 28,
    label_ar: 'غصن',
    label_fr: 'Rameau',
    label_en: 'Branch',
    impact_ar: 'يمول ترجمة ملخص وثيقة إلى ثلاث لغات.',
    impact_fr: 'Finance la traduction d\'un résumé en trois langues.',
    impact_en: 'Funds the translation of a document summary into three languages.',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'tier-shelf',
    amount_tnd: 300,
    amount_usd: 100,
    amount_eur: 92,
    label_ar: 'رفّ',
    label_fr: 'Étagère',
    label_en: 'Shelf',
    impact_ar: 'يغطّي تكلفة استضافة الموقع لشهر كامل.',
    impact_fr: 'Couvre un mois complet d\'hébergement.',
    impact_en: 'Covers one full month of hosting costs.',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'tier-library',
    amount_tnd: 1000,
    amount_usd: 320,
    amount_eur: 300,
    label_ar: 'مكتبة',
    label_fr: 'Bibliothèque',
    label_en: 'Library',
    impact_ar: 'يمول معالجة 30 وثيقة جديدة كاملة.',
    impact_fr: 'Finance le traitement complet de 30 nouveaux documents.',
    impact_en: 'Funds the complete processing of 30 new documents.',
    sort_order: 4,
    is_active: true,
  },
];
