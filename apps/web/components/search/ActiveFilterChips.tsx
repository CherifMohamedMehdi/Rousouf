/**
 * ActiveFilterChips — row of removable pill-buttons representing every
 * currently applied filter, rendered above the results list.
 *
 * Label resolution:
 * - For taxonomy filters, labels are resolved in the parent (server)
 *   component so that screen readers see a human name, not a slug.
 * - The row also shows the freetext query and year range if present.
 */
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { removeParam } from '@/lib/search/urlParams';

export interface Chip {
  paramKey: string;
  value: string;
  label: string;
}

export default function ActiveFilterChips({ chips }: { chips: Chip[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations('search');

  if (chips.length === 0) return null;

  function onRemove(paramKey: string, value: string) {
    const qs = removeParam(params, paramKey, value);
    router.push(`${pathname}?${qs}`);
  }

  function onClearAll() {
    router.push(pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
        {t('activeFilters')}
      </span>
      {chips.map((chip) => (
        <button
          key={`${chip.paramKey}:${chip.value}`}
          type="button"
          onClick={() => onRemove(chip.paramKey, chip.value)}
          className="inline-flex items-center gap-1 rounded-full border border-brand-blue/20 bg-brand-blue-soft px-3 py-1 text-xs font-medium text-brand-blue hover:bg-brand-blue hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
        >
          <span>{chip.label}</span>
          <X size={12} aria-hidden="true" />
          <span className="sr-only">remove filter</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-brand-ink-soft underline hover:text-brand-blue"
      >
        {t('clearAll')}
      </button>
    </div>
  );
}
