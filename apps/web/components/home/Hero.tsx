/**
 * Homepage hero — wordmark, tagline, large SearchBar, dual CTAs.
 */
import Link from 'next/link';
import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import SearchBar from '@/components/search/SearchBar';
import Button from '@/components/ui/Button';

export default async function Hero() {
  const locale = await getLocale();
  const t = await getTranslations('home');
  const tMeta = await getTranslations('meta');

  return (
    <section className="relative overflow-hidden bg-brand-paper">
      <div
        className="absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(27, 63, 110, 0.08), transparent 60%), radial-gradient(ellipse at bottom right, rgba(201, 149, 42, 0.10), transparent 55%)',
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-20 text-center md:pt-28">
        <h1 className="font-sans text-4xl font-semibold text-brand-blue md:text-display">
          {tMeta('siteName')}
        </h1>
        <p className="mt-4 text-lg text-brand-ink-soft md:text-xl">{tMeta('tagline')}</p>
        <p className="mx-auto mt-4 max-w-2xl text-base text-brand-ink-soft">
          {tMeta('description')}
        </p>

        <div className="mt-10">
          <Suspense fallback={<div className="h-12 w-full rounded-lg border border-border bg-white/70" aria-hidden="true" />}>
            <SearchBar size="large" />
          </Suspense>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/${locale}/search`}>
            <Button variant="outline">{t('heroCtaBrowse')}</Button>
          </Link>
          <Link href={`/${locale}/submit`}>
            <Button variant="ghost">{t('heroCtaContribute')}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
