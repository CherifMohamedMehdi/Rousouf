/**
 * Donation-related data access.
 */
import { isMockMode } from './client';
import { directusListItems } from './http';
import { mockDonors } from '@/mocks/donors';
import { mockDonationTiers } from '@/mocks/donationTiers';
import type { DonationTier, PublicDonor } from '@/types/directus';

function mapTierRow(row: Record<string, unknown>): DonationTier {
  return {
    id: String(row.id),
    amount_tnd: Number(row.amount_tnd ?? 0),
    amount_usd: Number(row.amount_usd ?? 0),
    amount_eur: Number(row.amount_eur ?? 0),
    label_ar: typeof row.label_ar === 'string' ? row.label_ar : undefined,
    label_fr: typeof row.label_fr === 'string' ? row.label_fr : undefined,
    label_en: typeof row.label_en === 'string' ? row.label_en : undefined,
    impact_ar: typeof row.impact_ar === 'string' ? row.impact_ar : undefined,
    impact_fr: typeof row.impact_fr === 'string' ? row.impact_fr : undefined,
    impact_en: typeof row.impact_en === 'string' ? row.impact_en : undefined,
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    is_active: Boolean(row.is_active),
  };
}

export async function getDonationTiers(): Promise<DonationTier[]> {
  if (isMockMode()) {
    return mockDonationTiers.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    const rows = await directusListItems<Record<string, unknown>>('donation_tiers', {
      sort: 'sort_order',
      limit: '50',
    });
    return rows
      .map(mapTierRow)
      .filter((t) => t.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    return mockDonationTiers.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }
}

function donationToPublicDonor(row: Record<string, unknown>): PublicDonor | null {
  if (row.status !== 'succeeded') return null;
  if (row.is_anonymous === true || row.is_anonymous === 1) return null;
  if (!(row.display_on_homepage === true || row.display_on_homepage === 1)) return null;
  const name =
    (typeof row.public_display_name === 'string' && row.public_display_name.trim()
      ? row.public_display_name
      : typeof row.donor_name === 'string' && row.donor_name.trim()
        ? row.donor_name
        : '') || null;
  if (!name) return null;
  const dc = typeof row.date_created === 'string' ? row.date_created : new Date().toISOString();
  const month = dc.slice(0, 7);
  return { id: String(row.id), display_name: name, month };
}

export async function getPublicDonors(limit = 30): Promise<PublicDonor[]> {
  const shuffle = (list: PublicDonor[]) => {
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, limit);
  };

  if (isMockMode()) {
    return shuffle(mockDonors);
  }

  try {
    const rows = await directusListItems<Record<string, unknown>>('donations', {
      sort: '-date_created',
      limit: '200',
    });
    const mapped = rows.map(donationToPublicDonor).filter(Boolean) as PublicDonor[];
    if (mapped.length) return shuffle(mapped);
  } catch {
    // fall through
  }
  return shuffle(mockDonors);
}
