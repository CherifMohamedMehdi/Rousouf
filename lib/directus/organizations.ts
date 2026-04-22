/**
 * Organization data access.
 */
import { isMockMode } from './client';
import { mockOrganizations } from '@/mocks/organizations';
import type { Organization } from '@/types/directus';

export async function getOrganizations(): Promise<Organization[]> {
  if (isMockMode()) {
    return mockOrganizations
      .filter((o) => o.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return mockOrganizations;
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const all = await getOrganizations();
  return all.find((o) => o.slug === slug) ?? null;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const all = await getOrganizations();
  return all.find((o) => o.id === id) ?? null;
}
