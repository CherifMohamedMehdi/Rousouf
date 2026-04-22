/**
 * Team members data access.
 */
import { isMockMode } from './client';
import { mockTeamMembers } from '@/mocks/teamMembers';
import type { TeamMember } from '@/types/directus';

export async function getTeamMembers(): Promise<TeamMember[]> {
  const list = isMockMode() ? mockTeamMembers : mockTeamMembers;
  return list.filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
}
