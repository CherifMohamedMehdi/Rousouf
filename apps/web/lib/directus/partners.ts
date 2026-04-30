/**
 * Partner data access.
 */
import { parseDirectusFileField } from './catalog';
import { isMockMode } from './client';
import { directusListItems } from './http';
import { mockPartners } from '@/mocks/partners';
import type { Partner } from '@/types/directus';

export interface PartnerQuery {
  onlyHomepage?: boolean;
}

function mapPartnerRow(row: Record<string, unknown>): Partner {
  const logo =
    parseDirectusFileField(row.logo) ??
    ({ id: 'placeholder', url: '/logo.svg' } as Partner['logo']);
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    logo,
    website: typeof row.website === 'string' ? row.website : undefined,
    tier: (row.tier as Partner['tier']) ?? 'supporting',
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    is_active: Boolean(row.is_active),
    display_on_homepage: Boolean(row.display_on_homepage),
  };
}

export async function getPartners(query: PartnerQuery = {}): Promise<Partner[]> {
  if (isMockMode()) {
    return mockPartners
      .filter((p) => p.is_active)
      .filter((p) => (query.onlyHomepage ? p.display_on_homepage : true))
      .sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    const rows = await directusListItems<Record<string, unknown>>('partners', {
      sort: 'sort_order',
      limit: '200',
    });
    return rows
      .map(mapPartnerRow)
      .filter((p) => p.is_active)
      .filter((p) => (query.onlyHomepage ? p.display_on_homepage : true))
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    return mockPartners
      .filter((p) => p.is_active)
      .filter((p) => (query.onlyHomepage ? p.display_on_homepage : true))
      .sort((a, b) => a.sort_order - b.sort_order);
  }
}
