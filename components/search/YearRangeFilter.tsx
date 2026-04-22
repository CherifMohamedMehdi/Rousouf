/**
 * YearRangeFilter — two numeric inputs bound to `yearFrom` and `yearTo`.
 *
 * Debounced so typing doesn't spam the router with every keystroke. Clamps
 * values to the [min,max] corpus bounds provided by the parent.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { buildQueryString } from '@/lib/search/urlParams';

export default function YearRangeFilter({ min, max }: { min: number; max: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations('search.filters');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [from, setFrom] = useState(params.get('yearFrom') ?? '');
  const [to, setTo] = useState(params.get('yearTo') ?? '');

  useEffect(() => {
    setFrom(params.get('yearFrom') ?? '');
    setTo(params.get('yearTo') ?? '');
  }, [params]);

  function apply(nextFrom: string, nextTo: string) {
    const clamped = (val: string): string | undefined => {
      if (!val) return undefined;
      const n = Number(val);
      if (!Number.isFinite(n)) return undefined;
      const clamp = Math.min(Math.max(n, min), max);
      return String(clamp);
    };
    const qs = buildQueryString(params, {
      yearFrom: clamped(nextFrom),
      yearTo: clamped(nextTo),
      page: undefined,
    });
    router.push(`${pathname}?${qs}`);
  }

  function onChange(which: 'from' | 'to', value: string) {
    if (which === 'from') setFrom(value);
    else setTo(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      apply(which === 'from' ? value : from, which === 'to' ? value : to);
    }, 400);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="flex-1">
        <span className="sr-only">{t('yearRange')} — from</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          placeholder={String(min)}
          value={from}
          onChange={(e) => onChange('from', e.target.value)}
          className="h-9 w-full rounded border border-border bg-white px-2 text-foreground outline-none focus:border-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
        />
      </label>
      <span aria-hidden="true" className="text-brand-ink-soft">
        —
      </span>
      <label className="flex-1">
        <span className="sr-only">{t('yearRange')} — to</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          placeholder={String(max)}
          value={to}
          onChange={(e) => onChange('to', e.target.value)}
          className="h-9 w-full rounded border border-border bg-white px-2 text-foreground outline-none focus:border-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
        />
      </label>
    </div>
  );
}
