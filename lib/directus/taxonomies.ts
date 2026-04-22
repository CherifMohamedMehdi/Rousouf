/**
 * Taxonomy data access.
 *
 * Server code imports these functions and never touches mock data or the
 * Directus SDK directly. Swapping to real Directus means replacing the
 * `return mock…` line inside `isMockMode()` with the matching SDK call.
 */
import { isMockMode } from './client';
import { mockDocumentTypes, mockGovernorates, mockLanguages, mockThemes } from '@/mocks/taxonomies';
import type { DocumentType, Governorate, Language, Theme } from '@/types/directus';

function sortByOrder<T extends { sort_order?: number; name_en: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const sa = a.sort_order ?? 1000;
    const sb = b.sort_order ?? 1000;
    if (sa !== sb) return sa - sb;
    return a.name_en.localeCompare(b.name_en);
  });
}

export async function getThemes(): Promise<Theme[]> {
  if (isMockMode()) return sortByOrder(mockThemes);
  // const client = directus();
  // return client.request(readItems('themes', { sort: ['sort_order', 'name_en'] }));
  return sortByOrder(mockThemes);
}

export async function getDocumentTypes(): Promise<DocumentType[]> {
  if (isMockMode()) return sortByOrder(mockDocumentTypes);
  return sortByOrder(mockDocumentTypes);
}

export async function getGovernorates(): Promise<Governorate[]> {
  if (isMockMode()) return sortByOrder(mockGovernorates);
  return sortByOrder(mockGovernorates);
}

export async function getLanguages(): Promise<Language[]> {
  if (isMockMode()) return sortByOrder(mockLanguages);
  return sortByOrder(mockLanguages);
}

export async function getThemeBySlug(slug: string): Promise<Theme | null> {
  const all = await getThemes();
  return all.find((t) => t.slug === slug) ?? null;
}

export async function getLanguageBySlug(slug: string): Promise<Language | null> {
  const all = await getLanguages();
  return all.find((l) => l.slug === slug) ?? null;
}
