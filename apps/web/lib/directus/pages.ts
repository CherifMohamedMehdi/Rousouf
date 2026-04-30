/**
 * Pages singleton data access — mission, impact callouts, social links.
 */
import { isMockMode } from './client';
import { directusGetSingleton } from './http';
import { mockPages } from '@/mocks/pages';
import type { ImpactCallout, PagesSingleton } from '@/types/directus';

function asCallouts(raw: unknown): ImpactCallout[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((x) => {
      if (!x || typeof x !== 'object') return null;
      const o = x as Record<string, unknown>;
      if (typeof o.title !== 'string' || typeof o.body !== 'string') return null;
      return { title: o.title, body: o.body };
    })
    .filter(Boolean) as ImpactCallout[];
}

function mapPagesRow(row: Record<string, unknown>): PagesSingleton {
  return {
    mission_ar: typeof row.mission_ar === 'string' ? row.mission_ar : undefined,
    mission_fr: typeof row.mission_fr === 'string' ? row.mission_fr : undefined,
    mission_en: typeof row.mission_en === 'string' ? row.mission_en : undefined,
    about_body_ar: typeof row.about_body_ar === 'string' ? row.about_body_ar : undefined,
    about_body_fr: typeof row.about_body_fr === 'string' ? row.about_body_fr : undefined,
    about_body_en: typeof row.about_body_en === 'string' ? row.about_body_en : undefined,
    impact_callouts_ar: asCallouts(row.impact_callouts_ar),
    impact_callouts_fr: asCallouts(row.impact_callouts_fr),
    impact_callouts_en: asCallouts(row.impact_callouts_en),
    transparency_note_ar: typeof row.transparency_note_ar === 'string' ? row.transparency_note_ar : undefined,
    transparency_note_fr: typeof row.transparency_note_fr === 'string' ? row.transparency_note_fr : undefined,
    transparency_note_en: typeof row.transparency_note_en === 'string' ? row.transparency_note_en : undefined,
    social_twitter: typeof row.social_twitter === 'string' ? row.social_twitter : undefined,
    social_linkedin: typeof row.social_linkedin === 'string' ? row.social_linkedin : undefined,
    social_facebook: typeof row.social_facebook === 'string' ? row.social_facebook : undefined,
    social_youtube: typeof row.social_youtube === 'string' ? row.social_youtube : undefined,
  };
}

export async function getPages(): Promise<PagesSingleton> {
  if (isMockMode()) return mockPages;
  try {
    const row = await directusGetSingleton<Record<string, unknown>>('pages');
    if (!row) return mockPages;
    return mapPagesRow(row);
  } catch {
    return mockPages;
  }
}
