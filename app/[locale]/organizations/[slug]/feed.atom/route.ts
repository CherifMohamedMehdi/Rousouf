/**
 * GET /[locale]/organizations/[slug]/feed.atom — Atom feed per organization.
 */
import { getDocuments } from '@/lib/directus/documents';
import { getOrganizationBySlug } from '@/lib/directus/organizations';
import { renderAtomFeed } from '@/lib/feeds/atom';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pickLocalizedName } from '@/lib/i18n/taxonomy';
import { absoluteUrl, siteUrl } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const revalidate = 600;

export async function GET(
  _req: Request,
  { params }: { params: { locale: string; slug: string } },
) {
  if (!isLocale(params.locale)) notFound();
  const org = await getOrganizationBySlug(params.slug);
  if (!org) notFound();

  const { items } = await getDocuments({
    status: 'published',
    organizationId: org.id,
    sort: 'recent',
    limit: 50,
  });

  const xml = renderAtomFeed({
    id: absoluteUrl(`/${params.locale}/organizations/${org.slug}/feed.atom`),
    title: `Roufouf — ${pickLocalizedName(org, params.locale as Locale)}`,
    selfUrl: absoluteUrl(`/${params.locale}/organizations/${org.slug}/feed.atom`),
    htmlUrl: `${siteUrl()}/${params.locale}/organizations/${org.slug}`,
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
