/**
 * SortDropdown — small <select> bound to the `sort` query parameter.
 *
 * Kept as a native <select> so it's fully accessible with zero extra JS
 * and works correctly under RTL.
 */
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { buildQueryString } from '@/lib/search/urlParams';

const OPTIONS = ['recent', 'relevant', 'oldest'] as const;

export default function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations('search.sort');
  const current = params.get('sort') ?? 'recent';

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const qs = buildQueryString(params, { sort: e.target.value, page: undefined });
    router.push(`${pathname}?${qs}`);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-brand-ink-soft">
      <span>{t('label')}</span>
      <select
        value={current}
        onChange={onChange}
        className="h-9 rounded border border-border bg-white px-2 text-sm text-foreground focus:border-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {t(opt)}
          </option>
        ))}
      </select>
    </label>
  );
}
