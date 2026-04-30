/**
 * /[locale]/donate/thank-you — post-donation confirmation.
 *
 * Arrival paths:
 *  1. The `disabled` provider (today): when a future provider wiring redirects
 *     here after recording a `donation_leads` row.
 *  2. Real providers (later): the intent route's `successUrl` points here,
 *     carrying a `reference` query param so the page can confirm the match.
 *
 * The page has intentionally no client-side state — it just shows a warm
 * acknowledgment and two clear next actions (continue exploring / share the
 * archive). That keeps it robust even when opened days later from an email.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Heart } from 'lucide-react';

import { isLocale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'donate.thankYou' });
  return { title: t('title'), robots: { index: false } };
}

export default async function DonateThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('donate');
  const reference =
    typeof resolvedSearchParams.reference === 'string' ? resolvedSearchParams.reference : undefined;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
        <Heart aria-hidden="true" size={28} />
      </div>
      <h1 className="mt-6 text-3xl font-semibold text-brand-blue md:text-4xl">
        {t('thankYou.title')}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-brand-ink-soft">
        {t('thankYou.body')}
      </p>

      {reference ? (
        <p className="mt-6 rounded-lg border border-border bg-white px-4 py-2 font-mono text-xs text-brand-ink-soft">
          Ref: {reference}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/${locale}`}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-medium text-white hover:bg-brand-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
        >
          {t('disabled.continueExploring')}
        </Link>
        <Link
          href={`/${locale}/search`}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-blue px-5 text-sm font-medium text-brand-blue hover:bg-brand-blue-soft"
        >
          {t('thankYou.browseCta')}
        </Link>
      </div>
    </div>
  );
}
