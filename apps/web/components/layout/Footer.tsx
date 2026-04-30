/**
 * Footer with tagline, social links, copyright, and a secondary nav.
 *
 * Social URLs are read from the `pages` singleton so admins can change them
 * without touching code.
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPages } from '@/lib/directus/pages';
import Logo from '@/components/brand/Logo';

export default async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations('footer');
  const tNav = await getTranslations('nav');
  const pages = await getPages();
  const year = new Date().getFullYear();

  const socials: Array<{ key: string; href?: string }> = [
    { key: 'Twitter / X', href: pages.social_twitter },
    { key: 'LinkedIn', href: pages.social_linkedin },
    { key: 'Facebook', href: pages.social_facebook },
    { key: 'YouTube', href: pages.social_youtube },
  ];

  return (
    <footer className="mt-24 border-t border-border bg-brand-paper-soft" data-hide-in-print="true">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-brand-ink-soft">{t('tagline')}</p>
          <p className="mt-2 max-w-sm text-sm text-brand-ink-soft">{t('credits')}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
            {tNav('home')}
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href={`/${locale}/search`} className="text-brand-ink hover:text-brand-blue">
                {tNav('search')}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/submit`} className="text-brand-ink hover:text-brand-blue">
                {tNav('submit')}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/about`} className="text-brand-ink hover:text-brand-blue">
                {tNav('about')}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/donate`} className="text-brand-ink hover:text-brand-blue">
                {tNav('donate')}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
            {t('social')}
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {socials
              .filter((s) => s.href)
              .map((s) => (
                <li key={s.key}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-ink hover:text-brand-blue"
                  >
                    {s.key}
                  </a>
                </li>
              ))}
            <li>
              <Link href={`/${locale}/feed.atom`} className="text-brand-ink hover:text-brand-blue">
                Atom feed
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-brand-ink-soft">
          {t('rights', { year })}
        </div>
      </div>
    </footer>
  );
}
