/**
 * /[locale]/organizations/[slug] — single organization profile.
 *
 * Shows the org's public profile, contact details, and a paginated list of
 * every published document it has contributed. Every metadata field has
 * an inline suggest-edit icon (via <OrganizationMetadataRow>).
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Mail, Phone, Globe, MapPin } from 'lucide-react';

import { getOrganizationBySlug } from '@/lib/directus/organizations';
import { getDocuments } from '@/lib/directus/documents';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { pickLocalizedName } from '@/lib/i18n/taxonomy';
import { absoluteUrl } from '@/lib/utils';
import { organizationJsonLd } from '@/lib/seo/jsonLd';

import JsonLd from '@/components/seo/JsonLd';
import OrgHeader from '@/components/org/OrgHeader';
import OrganizationMetadataRow from '@/components/organizations/OrganizationMetadataRow';
import ResultCard from '@/components/search/ResultCard';
import Pagination from '@/components/search/Pagination';
import { PAGE_SIZE } from '@/lib/search/urlParams';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const org = await getOrganizationBySlug(slug);
  if (!org) return {};
  const name = pickLocalizedName(org, locale) || org.name;
  return {
    title: name,
    description: org.description,
    alternates: {
      canonical: absoluteUrl(`/${locale}/organizations/${org.slug}`),
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/organizations/${org.slug}`])),
    },
  };
}

export default async function OrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  const resolvedSearchParams = await searchParams;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  const page = Math.max(
    1,
    Number(typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : 1) || 1,
  );
  const tOrg = await getTranslations('organization');

  const orgName = pickLocalizedName(org, locale as Locale) || org.name;
  const { items, total } = await getDocuments({
    organizationId: org.id,
    status: 'published',
    sort: 'recent',
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={organizationJsonLd(org, locale as Locale)} />

      <OrgHeader org={org} locale={locale as Locale} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="org-docs-heading">
          <h2 id="org-docs-heading" className="text-xl font-semibold text-brand-blue">
            {tOrg('documentsHeading', { org: orgName })}
          </h2>
          {items.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-brand-ink-soft">
              {tOrg('empty')}
            </p>
          ) : (
            <>
              <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((doc) => (
                  <li key={doc.id}>
                    <ResultCard document={doc} variant="compact" />
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} />
            </>
          )}
        </section>

        <aside className="space-y-6">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
              Contact
            </h2>
            <dl className="mt-3 rounded-lg border border-border bg-white px-4">
              <OrganizationMetadataRow
                orgId={org.id}
                fieldName="website"
                label={tOrg('website')}
                currentValue={org.website ?? ''}
              >
                {org.website ? (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline hover:text-brand-blue"
                  >
                    <Globe size={14} aria-hidden="true" />
                    {org.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : null}
              </OrganizationMetadataRow>
              <OrganizationMetadataRow
                orgId={org.id}
                fieldName="contact_email"
                label={tOrg('email')}
                currentValue={org.contact_email ?? ''}
              >
                {org.contact_email ? (
                  <a className="inline-flex items-center gap-1 underline" href={`mailto:${org.contact_email}`}>
                    <Mail size={14} aria-hidden="true" />
                    {org.contact_email}
                  </a>
                ) : null}
              </OrganizationMetadataRow>
              <OrganizationMetadataRow
                orgId={org.id}
                fieldName="contact_phone"
                label={tOrg('phone')}
                currentValue={org.contact_phone ?? ''}
              >
                {org.contact_phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={14} aria-hidden="true" />
                    {org.contact_phone}
                  </span>
                ) : null}
              </OrganizationMetadataRow>
              <OrganizationMetadataRow
                orgId={org.id}
                fieldName="contact_address"
                label={tOrg('address')}
                currentValue={org.contact_address ?? ''}
              >
                {org.contact_address ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} aria-hidden="true" />
                    {org.contact_address}
                  </span>
                ) : null}
              </OrganizationMetadataRow>
            </dl>
          </section>

          <Link
            href={`/${locale}/search?orgs=${encodeURIComponent(org.slug)}`}
            className="block rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium text-brand-blue hover:border-brand-blue"
          >
            View all documents by this organization →
          </Link>
        </aside>
      </div>
    </div>
  );
}
