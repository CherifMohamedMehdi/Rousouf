/**
 * Thematic tiles on the homepage.
 *
 * Reads directly from the themes taxonomy, so adding a theme in Directus
 * automatically surfaces a new tile — no code deploy needed.
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getThemes } from '@/lib/directus/taxonomies';
import { pickLabel } from '@/lib/i18n/taxonomy';
import type { Locale } from '@/lib/i18n/config';

const PALETTE = [
  'bg-brand-blue-soft text-brand-blue',
  'bg-brand-gold-soft text-brand-gold-dark',
  'bg-brand-teal-soft text-brand-teal',
];

export default async function ThemeTiles() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('home.themes');
  const themes = await getThemes();

  return (
    <section aria-labelledby="themes-heading" className="mx-auto max-w-6xl px-4 py-14">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 id="themes-heading" className="text-2xl font-semibold text-brand-blue md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-brand-ink-soft">{t('description')}</p>
        </div>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {themes.map((theme, idx) => (
          <li key={theme.id}>
            <Link
              href={`/${locale}/search?themes=${encodeURIComponent(theme.slug)}`}
              className="group flex h-full min-h-[110px] flex-col justify-between rounded-xl border border-border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${PALETTE[idx % PALETTE.length]}`}
              >
                {theme.slug}
              </span>
              <span className="mt-3 text-lg font-semibold text-brand-blue group-hover:text-brand-blue-dark">
                {pickLabel(theme, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
