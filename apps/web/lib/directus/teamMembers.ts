/**
 * Team members data access.
 */
import { getDirectusCatalog, parseDirectusFileField } from './catalog';
import { isMockMode } from './client';
import { directusListItems } from './http';
import { mockTeamMembers } from '@/mocks/teamMembers';
import type { Organization, TeamMember } from '@/types/directus';

function mapTeamMemberRow(row: Record<string, unknown>, organizations: Map<string, Organization>): TeamMember {
  const orgId = row.organization != null ? String(row.organization) : null;
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    role_ar: typeof row.role_ar === 'string' ? row.role_ar : undefined,
    role_fr: typeof row.role_fr === 'string' ? row.role_fr : undefined,
    role_en: typeof row.role_en === 'string' ? row.role_en : undefined,
    bio_ar: typeof row.bio_ar === 'string' ? row.bio_ar : undefined,
    bio_fr: typeof row.bio_fr === 'string' ? row.bio_fr : undefined,
    bio_en: typeof row.bio_en === 'string' ? row.bio_en : undefined,
    photo: parseDirectusFileField(row.photo),
    linkedin_url: typeof row.linkedin_url === 'string' ? row.linkedin_url : undefined,
    organization: orgId ? organizations.get(orgId) ?? null : null,
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    is_active: Boolean(row.is_active),
  };
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  if (isMockMode()) {
    return mockTeamMembers.filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    const catalog = await getDirectusCatalog();
    const rows = await directusListItems<Record<string, unknown>>('team_members', {
      sort: 'sort_order',
      limit: '100',
    });
    return rows
      .map((r) => mapTeamMemberRow(r, catalog.organizations))
      .filter((m) => m.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    return mockTeamMembers.filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }
}
