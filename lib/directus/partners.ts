/**
 * Partner data access.
 */
import { isMockMode } from './client';
import { mockPartners } from '@/mocks/partners';
import type { Partner } from '@/types/directus';

export interface PartnerQuery {
  onlyHomepage?: boolean;
}

export async function getPartners(query: PartnerQuery = {}): Promise<Partner[]> {
  const list = isMockMode() ? mockPartners : mockPartners;
  return list
    .filter((p) => p.is_active)
    .filter((p) => (query.onlyHomepage ? p.display_on_homepage : true))
    .sort((a, b) => a.sort_order - b.sort_order);
}
