/**
 * Metadata helpers consumed by every page's generateMetadata().
 *
 * Produces a uniform title/description/OG/canonical/alternates block so we
 * don't repeat ourselves across pages. When a page needs something special
 * (e.g. noindex on filtered search URLs), it passes overrides.
 */
import type { Metadata } from 'next';
import { locales, type Locale } from '@/lib/i18n/config';
import { siteUrl } from '@/lib/utils';

export interface PageMetadataInput {
  locale: Locale;
  title: string;
  description?: string;
  path: string; // e.g. "/documents/abc" — locale prefix is added automatically
  ogImage?: string;
  noindex?: boolean;
}

export function pageMetadata(input: PageMetadataInput): Metadata {
  const base = siteUrl();
  const canonical = `${base}/${input.locale}${input.path.startsWith('/') ? input.path : `/${input.path}`}`;
  const alternates = Object.fromEntries(
    locales.map((l) => [l, `${base}/${l}${input.path.startsWith('/') ? input.path : `/${input.path}`}`]),
  );
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: alternates,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      type: 'website',
      locale: input.locale,
      images: input.ogImage ? [{ url: input.ogImage }] : undefined,
    },
    twitter: {
      card: input.ogImage ? 'summary_large_image' : 'summary',
      title: input.title,
      description: input.description,
    },
    robots: input.noindex
      ? { index: false, follow: true }
      : undefined,
  };
}
