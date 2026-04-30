/**
 * Robots policy. Crawlers are welcome everywhere except API + Directus
 * admin-ish routes we don't want indexed.
 */
import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/static/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
