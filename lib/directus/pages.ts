/**
 * Pages singleton data access — mission, impact callouts, social links.
 */
import { isMockMode } from './client';
import { mockPages } from '@/mocks/pages';
import type { PagesSingleton } from '@/types/directus';

export async function getPages(): Promise<PagesSingleton> {
  if (isMockMode()) return mockPages;
  return mockPages;
}
