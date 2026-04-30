'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { buildQueryString, PAGE_SIZE_OPTIONS } from '@/lib/search/urlParams';

interface Props {
  current: number;
}

export default function PageSizeSelect({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations('search.pageSize');

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const limit = e.target.value;
    const qs = buildQueryString(params, { limit, page: undefined });
    router.push(`${pathname}?${qs}`);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-brand-ink-soft">
      <span>{t('label')}</span>
      <select
        value={String(current)}
        onChange={onChange}
        className="h-9 rounded border border-border bg-white px-2 text-sm text-foreground focus:border-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
      >
        {PAGE_SIZE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {t('option', { count: opt })}
          </option>
        ))}
      </select>
    </label>
  );
}

