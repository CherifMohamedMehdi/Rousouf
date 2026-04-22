/**
 * Root sitemap.
 *
 * Emits an entry per locale × static page, plus one entry per published
 * document (localized). Dynamic content counts are capped at 50k by
 * Next.js conventions — well under the 10k+ documents we plan to hold
 * once split per locale.
 */
import type { MetadataRoute } from 'next';
import { getAllPublishedDocuments } from '@/lib/directus/documents';
import { getOrganizations } from '@/lib/directus/organizations';
import { locales } from '@/lib/i18n/config';
import { siteUrl } from '@/lib/utils';

const STATIC_PATHS = ['', '/search', '/submit', '/about', '/donate'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const p of STATIC_PATHS) {
      entries.push({
        url: `${base}/${locale}${p}`,
        lastModified: now,
        changeFrequency: p === '' || p === '/search' ? 'daily' : 'weekly',
        priority: p === '' ? 1 : 0.6,
      });
    }
  }

  const [docs, orgs] = await Promise.all([getAllPublishedDocuments(), getOrganizations()]);
  for (const doc of docs) {
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}/documents/${doc.id}`,
        lastModified: doc.date_updated ?? doc.date_created ?? now,
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }
  for (const org of orgs) {
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}/organizations/${org.slug}`,
        lastModified: org.date_updated,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  }

  return entries;
}
