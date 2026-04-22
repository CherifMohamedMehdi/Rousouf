/**
 * GET /[locale]/themes/[slug]/feed.atom — Atom feed scoped to a single theme.
 */
import { getDocuments } from '@/lib/directus/documents';
import { getThemeBySlug } from '@/lib/directus/taxonomies';
import { renderAtomFeed } from '@/lib/feeds/atom';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pickLabel } from '@/lib/i18n/taxonomy';
import { absoluteUrl, siteUrl } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const revalidate = 600;

export async function GET(
  _req: Request,
  { params }: { params: { locale: string; slug: string } },
) {
  if (!isLocale(params.locale)) notFound();
  const theme = await getThemeBySlug(params.slug);
  if (!theme) notFound();

  const { items } = await getDocuments({
    status: 'published',
    themeSlugs: [params.slug],
    sort: 'recent',
    limit: 50,
  });

  const xml = renderAtomFeed({
    id: absoluteUrl(`/${params.locale}/themes/${params.slug}/feed.atom`),
    title: `Roufouf — ${pickLabel(theme, params.locale as Locale)}`,
    selfUrl: absoluteUrl(`/${params.locale}/themes/${params.slug}/feed.atom`),
    htmlUrl: `${siteUrl()}/${params.locale}/search?themes=${encodeURIComponent(params.slug)}`,
    locale: params.locale as Locale,
    documents: items,
  });
  return new Response(xml, {
    headers: {
      'content-type': 'application/atom+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=600',
    },
  });
}
