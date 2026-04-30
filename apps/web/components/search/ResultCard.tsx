/**
 * A single document card — used on the homepage's Recent Additions, the
 * Search results list, and the per-organization list.
 *
 * Props:
 * - `variant`: `compact` (homepage) | `full` (search results, with
 *   highlighted snippets).
 * - `highlightedTitle` / `highlightedSnippet`: when provided (from
 *   Meilisearch), rendered via dangerouslySetInnerHTML with <mark> styled
 *   in brand gold via globals.css.
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Document } from '@/types/directus';
import type { Locale } from '@/lib/i18n/config';
import { pickLabel, pickLocalizedAbstract, pickLocalizedName } from '@/lib/i18n/taxonomy';
import { truncate, yearOf } from '@/lib/utils';
import Tag from '@/components/ui/Tag';
import Badge from '@/components/ui/Badge';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

interface ResultCardProps {
  document: Document;
  variant?: 'compact' | 'full';
  highlightedTitle?: string;
  highlightedSnippet?: string;
}

export default async function ResultCard({
  document: doc,
  variant = 'full',
  highlightedTitle,
  highlightedSnippet,
}: ResultCardProps) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('document');
  const year = yearOf(doc.date_published);
  const abstract = pickLocalizedAbstract(doc, locale);
  const orgName = doc.organization ? pickLocalizedName(doc.organization, locale) : null;

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-brand-ink-soft">
        {year ? <span className="font-medium text-brand-blue">{year}</span> : <span>{t('unknownDate')}</span>}
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

      <h3 className="text-base font-semibold leading-snug text-brand-blue group-hover:text-brand-blue-dark md:text-lg">
        <Link href={`/${locale}/documents/${doc.id}`} className="before:absolute before:inset-0">
          {highlightedTitle ? (
            <span dangerouslySetInnerHTML={{ __html: highlightedTitle }} />
          ) : (
            doc.title
          )}
        </Link>
      </h3>

      {orgName && doc.organization ? (
        <p className="mt-1 text-sm text-brand-ink-soft">
          {t('publishedBy')}{' '}
          <span className="inline-flex items-center gap-1 text-brand-ink">
            {orgName}
            {doc.organization.is_verified ? <VerifiedBadge size={12} /> : null}
          </span>
        </p>
      ) : null}

      {variant === 'full' && abstract ? (
        <p className="mt-3 line-clamp-3 text-sm text-brand-ink-soft">
          {highlightedSnippet ? (
            <span dangerouslySetInnerHTML={{ __html: highlightedSnippet }} />
          ) : (
            truncate(abstract, 220)
          )}
        </p>
      ) : null}

      {variant === 'full' && doc.themes?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {doc.themes.slice(0, 4).map((theme) => (
            <Tag key={theme.id} href={`/${locale}/search?themes=${encodeURIComponent(theme.slug)}`}>
              {pickLabel(theme, locale)}
            </Tag>
          ))}
        </div>
      ) : null}
    </article>
  );
}
