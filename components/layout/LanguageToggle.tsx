/**
 * Language switcher. Rotates the user through ar → fr → en while preserving
 * the current path and query string. Dropdown variant used on desktop, a
 * simple rotate button used on mobile.
 */
'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

export default function LanguageToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = useLocale() as Locale;
  const t = useTranslations('nav');

  const buildHref = (target: Locale) => {
    const normalizedPath = pathname.replace(/^\/(ar|fr|en)(?=\/|$)/, '') || '/';
    const search = searchParams.toString();
    return `/${target}${normalizedPath === '/' ? '' : normalizedPath}${search ? `?${search}` : ''}`;
  };

  return (
    <nav aria-label={t('toggleLanguage')} className="flex items-center gap-1 text-sm">
      <Globe size={14} aria-hidden="true" className="me-1 text-brand-ink-soft" />
      {locales.map((l, idx) => (
        <Fragment key={l}>
          {idx > 0 ? <span className="text-brand-ink-soft/50" aria-hidden="true">/</span> : null}
          <Link
            href={buildHref(l)}
            locale={l}
            className={cn(
              'rounded px-1.5 py-0.5 text-brand-ink-soft hover:text-brand-blue',
              l === currentLocale && 'text-brand-blue font-semibold underline underline-offset-4',
            )}
            aria-current={l === currentLocale ? 'true' : undefined}
            hrefLang={l}
          >
            {localeNames[l]}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
