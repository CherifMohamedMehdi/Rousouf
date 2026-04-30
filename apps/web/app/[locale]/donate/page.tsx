/**
 * /[locale]/donate — transparent, UI-first donation page.
 *
 * Layout:
 *  - Intro + <ImpactCallouts> pulled from the Directus `pages` singleton.
 *  - The <DonateForm> with tier grid, privacy toggles, currency switcher.
 *  - <TransparencyNote> explaining how funds are used and how privacy works.
 *
 * Content comes from Directus collections so editors can adjust impact
 * callouts, suggested amounts, and trust copy without touching code.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { getDonationTiers } from '@/lib/directus/donations';
import { getPages } from '@/lib/directus/pages';
import DonateForm from '@/components/donate/DonateForm';
import ImpactCallouts from '@/components/donate/ImpactCallouts';
import TransparencyNote from '@/components/donate/TransparencyNote';
import { isLocale } from '@/lib/i18n/config';
import type { ImpactCallout } from '@/types/directus';

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'donate' });
  return { title: t('title'), description: t('intro') };
}

export default async function DonatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('donate');
  const [tiers, pages] = await Promise.all([getDonationTiers(), getPages()]);

  const callouts: ImpactCallout[] =
    pages[`impact_callouts_${locale}` as const] ??
    pages.impact_callouts_en ??
    [];
  const transparencyNote =
    pages[`transparency_note_${locale}` as const] ??
    pages.transparency_note_en ??
    '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold text-brand-blue md:text-4xl">{t('title')}</h1>
        <p className="mt-3 text-base leading-relaxed text-brand-ink-soft">{t('intro')}</p>
      </header>

      <ImpactCallouts callouts={callouts} />

      <section
        aria-label="Donate form"
        className="mt-10 rounded-2xl border border-border bg-brand-paper-soft p-6"
      >
        <DonateForm tiers={tiers} />
      </section>

      <TransparencyNote note={transparencyNote} />
    </div>
  );
}
