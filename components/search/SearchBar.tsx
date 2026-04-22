/**
 * Search bar used on the hero and inside the search page.
 *
 * - Submits to `/<locale>/search?q=…` preserving any existing query params
 *   so filters stay pinned when the user refines.
 * - Large visual presence in `large` mode (hero), compact in `inline` mode.
 */
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  size?: 'large' | 'inline';
  initialQuery?: string;
  className?: string;
}

export default function SearchBar({ size = 'inline', initialQuery = '', className }: SearchBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('home');
  const [value, setValue] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const usp = new URLSearchParams(params.toString());
    if (value.trim()) usp.set('q', value.trim());
    else usp.delete('q');
    router.push(`/${locale}/search?${usp.toString()}`);
  }

  const isLarge = size === 'large';

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn(
        'flex w-full items-stretch overflow-hidden rounded-xl border border-border bg-white shadow-card',
        isLarge ? 'h-14 text-base' : 'h-11 text-sm',
        className,
      )}
    >
      <label htmlFor={isLarge ? 'hero-search' : 'inline-search'} className="sr-only">
        {t('heroSearchLabel')}
      </label>
      <div className="flex items-center ps-4 text-brand-ink-soft" aria-hidden="true">
        <Search size={isLarge ? 20 : 16} />
      </div>
      <input
        id={isLarge ? 'hero-search' : 'inline-search'}
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('heroSearchPlaceholder')}
        className="flex-1 bg-transparent px-3 text-foreground outline-none placeholder:text-brand-ink-soft"
        autoComplete="off"
      />
      <button
        type="submit"
        className={cn(
          'bg-brand-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold',
        )}
      >
        {t('heroSearchCta')}
      </button>
    </form>
  );
}
