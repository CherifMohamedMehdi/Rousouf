/**
 * schema.org JSON-LD builders. Each function returns a plain object; a
 * <JsonLd> client component serializes it into a <script> tag.
 */
import type { Document, Organization } from '@/types/directus';
import { resolvePublicPdfFile } from '@/lib/pdf/resolvePublicPdfFile';
import type { Locale } from '@/lib/i18n/config';
import { siteUrl, absoluteUrl } from '@/lib/utils';
import { pickLocalizedAbstract, pickLocalizedName } from '@/lib/i18n/taxonomy';

export function websiteJsonLd(locale: Locale, siteName: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description,
    url: `${siteUrl()}/${locale}`,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl()}/${locale}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationJsonLd(org: Organization, locale: Locale) {
  const name = pickLocalizedName(org, locale) || org.name;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: org.website ?? absoluteUrl(`/${locale}/organizations/${org.slug}`),
    logo: org.logo?.url ? absoluteUrl(org.logo.url) : undefined,
    contactPoint: org.contact_email
      ? {
          '@type': 'ContactPoint',
          email: org.contact_email,
          contactType: 'customer support',
        }
      : undefined,
    address: org.contact_address
      ? {
          '@type': 'PostalAddress',
          streetAddress: org.contact_address,
        }
      : undefined,
  };
}

export function documentJsonLd(doc: Document, locale: Locale) {
  const abstract = pickLocalizedAbstract(doc, locale);
  const orgName = doc.organization ? pickLocalizedName(doc.organization, locale) : null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Report',
    name: doc.title,
    headline: doc.title,
    abstract,
    description: abstract,
    author: doc.author
      ? { '@type': 'Person', name: doc.author }
      : orgName
        ? { '@type': 'Organization', name: orgName }
        : undefined,
    publisher: orgName
      ? { '@type': 'Organization', name: orgName }
      : { '@type': 'Organization', name: 'Roufouf' },
    datePublished: doc.date_published ?? undefined,
    inLanguage: doc.language?.slug,
    keywords: doc.keywords?.join(', '),
    about: doc.themes?.map((t) => pickLocalizedName(t, locale)).filter(Boolean),
    url: absoluteUrl(`/${locale}/documents/${doc.id}`),
    encoding: doc.files?.length
      ? doc.files.map((f) => ({
          '@type': 'MediaObject',
          contentUrl: absoluteUrl(resolvePublicPdfFile(doc, f).url),
          encodingFormat: 'application/pdf',
        }))
      : undefined,
  };
}
