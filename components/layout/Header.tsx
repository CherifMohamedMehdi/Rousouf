/**
 * Top site header. Sticky, compact, and RTL-aware.
 *
 * - Logo + wordmark routes to the locale home
 * - Primary nav (Home, Browse, Contribute, About, Donate)
 * - LanguageToggle on the far side
 * - Collapses into a disclosure menu below `md` breakpoint
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import LanguageToggle from './LanguageToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  key: 'home' | 'search' | 'submit' | 'about' | 'donate';
  href: string;
}

const NAV: NavItem[] = [
  { key: 'home', href: '' },
  { key: 'search', href: '/search' },
  { key: 'submit', href: '/submit' },
  { key: 'about', href: '/about' },
  { key: 'donate', href: '/donate' },
];

export default function Header() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    const target = `/${locale}${href}`;
    if (!href) return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-paper/80 backdrop-blur border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={`/${locale}`} aria-label={t('home')} className="flex items-center">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-brand-ink-soft hover:text-brand-blue hover:bg-brand-blue-soft',
                isActive(item.href) && 'text-brand-blue',
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Suspense fallback={<div className="h-6 w-24" aria-hidden="true" />}>
            <LanguageToggle />
          </Suspense>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-brand-ink-soft md:hidden"
          aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-brand-paper md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3" aria-label="Primary mobile">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-base font-medium text-brand-ink-soft hover:text-brand-blue hover:bg-brand-blue-soft',
                  isActive(item.href) && 'text-brand-blue',
                )}
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-2">
              <Suspense fallback={<div className="h-6 w-24" aria-hidden="true" />}>
                <LanguageToggle />
              </Suspense>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
