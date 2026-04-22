/**
 * Organization data access.
 */
import { getDirectusCatalog, mapDirectusOrganization } from './catalog';
import { isMockMode } from './client';
import { directusListItems } from './http';
import { mockOrganizations } from '@/mocks/organizations';
import type { Organization } from '@/types/directus';

export async function getOrganizations(): Promise<Organization[]> {
  if (isMockMode()) {
    return mockOrganizations
      .filter((o) => o.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  try {
    const { organizations } = await getDirectusCatalog();
    return [...organizations.values()]
      .filter((o) => o.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return mockOrganizations
      .filter((o) => o.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  if (isMockMode()) {
    const all = await getOrganizations();
    return all.find((o) => o.slug === slug) ?? null;
  }
  try {
    const { organizations } = await getDirectusCatalog();
    const hit = [...organizations.values()].find((o) => o.slug === slug);
    if (hit) return hit;
    const rows = await directusListItems<Record<string, unknown>>('organizations', {
      'filter[slug][_eq]': slug,
      limit: '1',
    });
    return rows[0] ? mapDirectusOrganization(rows[0]) : null;
  } catch {
    return mockOrganizations.find((o) => o.slug === slug) ?? null;
  }
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  if (isMockMode()) {
    const all = await getOrganizations();
    return all.find((o) => o.id === id) ?? null;
  }
  try {
    const { organizations } = await getDirectusCatalog();
    return organizations.get(id) ?? null;
  } catch {
    return mockOrganizations.find((o) => o.id === id) ?? null;
  }
}
