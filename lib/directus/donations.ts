/**
 * Donation-related data access.
 *
 * The public donor view is strictly filtered to the privacy-safe subset:
 * opted-in non-anonymous succeeded donations, exposing only display name
 * and month.
 */
import { isMockMode } from './client';
import { mockDonors } from '@/mocks/donors';
import { mockDonationTiers } from '@/mocks/donationTiers';
import type { DonationTier, PublicDonor } from '@/types/directus';

export async function getDonationTiers(): Promise<DonationTier[]> {
  const list = isMockMode() ? mockDonationTiers : mockDonationTiers;
  return list.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Returns the shuffled pool of opted-in donors, truncated to `limit`.
 * Shuffling is server-side so order varies per request even under cache.
 */
export async function getPublicDonors(limit = 30): Promise<PublicDonor[]> {
  const source = isMockMode() ? mockDonors : mockDonors;
  const shuffled = [...source];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, limit);
}
