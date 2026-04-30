/**
 * /[locale]/documents/[id] — a single document's canonical page.
 *
 * Sections (top to bottom):
 *  1. Header with title, authors, organization (with verified badge),
 *     publication date, and version banner (if superseded).
 *  2. Abstract — localized to the current locale.
 *  3. Metadata sidebar with inline suggest-edit icons per field.
 *  4. PDF viewer + download buttons for each attached file; optional “Suggest a
 *     translated PDF” (same moderation path as metadata suggestions).
 *  5. CitationBlock (APA/Chicago/MLA/BibTeX/RIS) with missing-field warnings.
 *  6. ShareButtons.
 *  7. RelatedDocuments by organization and by theme.
 *
 * SEO:
 *  - <generateMetadata> fills OpenGraph + canonical + language alternates.
 *  - Renders schema.org/Report JSON-LD.
 *  - Uses the `.print-page` class from globals.css for a clean printable
 *    layout (triggered by @media print).
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations, getLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { getDocumentById, getRelatedByOrganization, getRelatedByTheme } from '@/lib/directus/documents';
import { resolvePublicPdfFile } from '@/lib/pdf/resolvePublicPdfFile';
import { getLanguages } from '@/lib/directus/taxonomies';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { pickLabel, pickLocalizedAbstract, pickLocalizedName, suggestableAbstractField } from '@/lib/i18n/taxonomy';
import { absoluteUrl, yearOf } from '@/lib/utils';
import { documentJsonLd } from '@/lib/seo/jsonLd';
import JsonLd from '@/components/seo/JsonLd';
import Tag from '@/components/ui/Tag';
import Badge from '@/components/ui/Badge';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import InlineFieldSuggestHeading from '@/components/documents/InlineFieldSuggestHeading';
import PdfViewer from '@/components/documents/PdfViewer';
import CitationBlock from '@/components/documents/CitationBlock';
import ShareButtons from '@/components/documents/ShareButtons';
import MetadataRow from '@/components/documents/MetadataRow';
import RelatedDocuments from '@/components/documents/RelatedDocuments';
import SuggestTranslationButton from '@/components/documents/SuggestTranslationButton';
import { Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const doc = await getDocumentById(id);
  if (!doc) return {};
  const abstract = pickLocalizedAbstract(doc, locale);
  const url = absoluteUrl(`/${locale}/documents/${doc.id}`);
  return {
    title: doc.title,
    description: abstract || undefined,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/documents/${doc.id}`])),
    },
    openGraph: {
      title: doc.title,
      description: abstract || undefined,
      type: 'article',
      url,
      publishedTime: doc.date_published ?? undefined,
    },
  };
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const doc = await getDocumentById(id);
  if (!doc) notFound();

  const tDoc = await getTranslations('document');
  const abstract = pickLocalizedAbstract(doc, locale);
  const abstractSuggest = suggestableAbstractField(doc, locale);
  const year = yearOf(doc.date_published);
  const mainFile = doc.files.find((f) => f.kind === 'main') ?? doc.files[0];
  const mainPublicPdf = mainFile ? resolvePublicPdfFile(doc, mainFile) : null;
  const orgName = doc.organization ? pickLocalizedName(doc.organization, locale) : '';

  const [byOrg, byTheme, languages] = await Promise.all([
    getRelatedByOrganization(doc.id, doc.organization?.id ?? null, 6),
    getRelatedByTheme(doc.id, doc.themes[0]?.slug ?? null, 6),
    getLanguages(),
  ]);

  const jsonLd = documentJsonLd(doc, locale as Locale);

  return (
    <article className="print-page mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={jsonLd} />

      {/* Version banners -------------------------------------------------- */}
      {doc.superseded_by ? (
        <div
          role="status"
          className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <span>{tDoc('supersededBanner')}</span>
          <Link
            href={`/${locale}/documents/${doc.superseded_by.id}`}
            className="inline-flex items-center gap-1 font-medium underline"
          >
            {tDoc('viewNewer')} <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
      {doc.supersedes ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm text-brand-ink-soft">
          <span>{tDoc('supersedesBanner')}</span>
          <Link
            href={`/${locale}/documents/${doc.supersedes.id}`}
            className="inline-flex items-center gap-1 font-medium text-brand-blue underline"
          >
            {tDoc('viewOlder')} <ArrowDownLeft size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-brand-ink-soft">
          {year ? <span className="font-medium text-brand-blue">{year}</span> : <span>{tDoc('unknownDate')}</span>}
          {doc.document_type ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{pickLabel(doc.document_type, locale)}</span>
            </>
          ) : null}
          {doc.language ? (
            <>
              <span aria-hidden="true">·</span>
              <Badge tone="soft">{pickLabel(doc.language, locale).toLowerCase()}</Badge>
            </>
          ) : null}
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-brand-blue md:text-4xl">{doc.title}</h1>
        {doc.organization ? (
          <p className="mt-2 text-base text-brand-ink-soft">
            {tDoc('publishedBy')}{' '}
            <Link
              href={`/${locale}/organizations/${doc.organization.slug}`}
              className="inline-flex items-center gap-1 text-brand-ink underline hover:text-brand-blue"
            >
              {orgName}
              {doc.organization.is_verified ? <VerifiedBadge size={12} /> : null}
            </Link>
          </p>
        ) : null}
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_320px]">
        {/* Main column ----------------------------------------------------- */}
        <div className="space-y-8">
          <section aria-labelledby="doc-abstract-heading">
            <h2 id="doc-abstract-heading" className="sr-only">
              {tDoc('abstract')}
            </h2>
            <InlineFieldSuggestHeading
              label={tDoc('abstract')}
              targetType="document"
              targetId={doc.id}
              fieldName={abstractSuggest.fieldName}
              fieldLabel={tDoc('abstract')}
              currentValue={abstractSuggest.currentValue}
            />
            <p
              className={`rounded-xl bg-brand-paper-soft p-5 text-base leading-relaxed ${abstract ? 'text-brand-ink' : 'italic text-brand-ink-soft'}`}
            >
              {abstract || '—'}
            </p>
          </section>

          {mainFile && mainPublicPdf ? (
            <PdfViewer fileUrl={mainPublicPdf.url} filename={mainPublicPdf.filename} title={doc.title} />
          ) : null}

          <section aria-labelledby="metadata-heading">
            <h2 id="metadata-heading" className="text-lg font-semibold text-brand-blue">
              Metadata
            </h2>
            <dl className="mt-3 rounded-lg border border-border bg-white px-4">
              <MetadataRow
                label={tDoc('publishedBy')}
                targetType="document"
                targetId={doc.id}
                fieldName="organization"
                currentValue={orgName}
                missingHint={!doc.organization}
              >
                {doc.organization ? (
                  <Link
                    href={`/${locale}/organizations/${doc.organization.slug}`}
                    className="underline hover:text-brand-blue"
                  >
                    {orgName}
                  </Link>
                ) : (
                  '—'
                )}
              </MetadataRow>
              <MetadataRow
                label={tDoc('datePublished')}
                targetType="document"
                targetId={doc.id}
                fieldName="date_published"
                currentValue={doc.date_published ?? ''}
                missingHint={!doc.date_published}
              >
                {doc.date_published ?? tDoc('unknownDate')}
              </MetadataRow>
              <MetadataRow
                label={tDoc('language')}
                targetType="document"
                targetId={doc.id}
                fieldName="language"
                currentValue={doc.language ? pickLabel(doc.language, locale) : ''}
                missingHint={!doc.language}
              >
                {doc.language ? pickLabel(doc.language, locale) : '—'}
              </MetadataRow>
              <MetadataRow
                label={tDoc('documentType')}
                targetType="document"
                targetId={doc.id}
                fieldName="document_type"
                currentValue={doc.document_type ? pickLabel(doc.document_type, locale) : ''}
                missingHint={!doc.document_type}
              >
                {doc.document_type ? pickLabel(doc.document_type, locale) : '—'}
              </MetadataRow>
              <MetadataRow
                label={tDoc('themes')}
                targetType="document"
                targetId={doc.id}
                fieldName="themes"
                currentValue={doc.themes.map((t) => pickLabel(t, locale)).join(', ')}
                missingHint={!doc.themes.length}
              >
                {doc.themes.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {doc.themes.map((theme) => (
                      <Tag key={theme.id} href={`/${locale}/search?themes=${encodeURIComponent(theme.slug)}`}>
                        {pickLabel(theme, locale)}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  '—'
                )}
              </MetadataRow>
              <MetadataRow
                label={tDoc('governorates')}
                targetType="document"
                targetId={doc.id}
                fieldName="governorates"
                currentValue={doc.governorates.map((g) => pickLabel(g, locale)).join(', ')}
                missingHint={!doc.governorates.length}
              >
                {doc.governorates.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {doc.governorates.map((g) => (
                      <Tag key={g.id} href={`/${locale}/search?governorates=${encodeURIComponent(g.slug)}`}>
                        {pickLabel(g, locale)}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  '—'
                )}
              </MetadataRow>
              <MetadataRow
                label={tDoc('keywords')}
                targetType="document"
                targetId={doc.id}
                fieldName="keywords"
                currentValue={(doc.keywords ?? []).join(', ')}
                missingHint={!doc.keywords?.length}
              >
                {doc.keywords?.length ? doc.keywords.join(', ') : '—'}
              </MetadataRow>
            </dl>
          </section>

          <CitationBlock document={doc} />
          <ShareButtons url={absoluteUrl(`/${locale}/documents/${doc.id}`)} title={doc.title} />
        </div>

        {/* Sidebar --------------------------------------------------------- */}
        <aside className="space-y-6">
          <section aria-labelledby="files-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="files-heading" className="text-lg font-semibold text-brand-blue">
                {tDoc('files')}
              </h2>
              <SuggestTranslationButton
                documentId={doc.id}
                documentLanguageId={doc.language?.id ?? null}
                languages={languages.map((l) => ({
                  id: l.id,
                  slug: l.slug,
                  name_ar: l.name_ar,
                  name_fr: l.name_fr,
                  name_en: l.name_en,
                }))}
              />
            </div>
            <ul className="mt-3 space-y-2">
              {doc.files.map((f) => {
                const pub = resolvePublicPdfFile(doc, f);
                const labelFallback = pub.filename ?? f.file.filename;
                return (
                <li key={f.id}>
                  <a
                    href={pub.url}
                    download
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm hover:border-brand-blue hover:text-brand-blue"
                  >
                    <span className="truncate">
                      {(f.kind === 'main' && tDoc('mainFile')) ||
                        (f.kind === 'executive_summary' && tDoc('executiveSummary')) ||
                        (f.kind === 'annex' && tDoc('annex')) ||
                        (f.kind === 'dataset' && tDoc('dataset')) ||
                        labelFallback}
                    </span>
                    <Download size={14} aria-hidden="true" />
                  </a>
                </li>
              );
              })}
            </ul>
          </section>
        </aside>
      </div>

      <RelatedDocuments
        heading={tDoc('relatedFromOrg', { org: orgName || 'organization' })}
        items={byOrg}
      />
      <RelatedDocuments
        heading={tDoc('relatedByTheme', {
          theme: doc.themes[0] ? pickLabel(doc.themes[0], locale) : '',
        })}
        items={byTheme}
      />
    </article>
  );
}
