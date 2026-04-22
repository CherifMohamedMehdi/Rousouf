/**
 * GET /[locale]/feed.atom — global Atom feed of the 50 most recently
 * published documents for the given locale. Public, cached at the edge.
 */
import { getDocuments } from '@/lib/directus/documents';
import { renderAtomFeed } from '@/lib/feeds/atom';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { absoluteUrl, siteUrl } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const revalidate = 600;

export async function GET(_req: Request, { params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const { items } = await getDocuments({ status: 'published', sort: 'recent', limit: 50 });
  const xml = renderAtomFeed({
    id: absoluteUrl(`/${params.locale}/feed.atom`),
    title: 'Roufouf — latest documents',
    selfUrl: absoluteUrl(`/${params.locale}/feed.atom`),
    htmlUrl: `${siteUrl()}/${params.locale}/search`,
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
