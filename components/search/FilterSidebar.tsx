/**
 * FilterSidebar — dynamic sidebar built from Directus taxonomies.
 *
 * Rendering model:
 * - The parent (server) fetches taxonomies and passes them as props.
 * - Each filter group is a collapsible <details> for zero-JS accessibility.
 * - Selecting/deselecting a value toggles the corresponding query-string
 *   param via the router, preserving every other active filter.
 *
 * Why this lives in its own client island:
 * - The rest of the search page is a server component that re-renders on
 *   URL changes. This component only owns the interactive toggles.
 */
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toggleParam } from '@/lib/search/urlParams';
import type { SearchFacet } from '@/lib/search/facets';
import YearRangeFilter from './YearRangeFilter';

export interface FilterSidebarProps {
  facets: SearchFacet[];
  yearMin: number;
  yearMax: number;
}

export default function FilterSidebar({ facets, yearMin, yearMax }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations('search');
  const [queries, setQueries] = useState<Record<string, string>>({});

  function onToggle(paramKey: string, value: string) {
    const qs = toggleParam(params, paramKey, value);
    router.push(`${pathname}?${qs}`);
  }

  function onSearch(groupKey: string, value: string) {
    setQueries((prev) => ({ ...prev, [groupKey]: value }));
  }

  return (
    <aside className="w-full space-y-3" aria-label={t('filtersHeading')}>
      {facets.map((group) => {
        const selected = new Set(params.getAll(group.paramKey));
        const localQuery = (queries[group.key] ?? '').toLocaleLowerCase();
        const visibleItems = group.options.filter((item) => item.label.toLocaleLowerCase().includes(localQuery));

        return (
          <details key={group.key} open className="group rounded-lg border border-border bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-brand-blue">
              <span>{group.label}</span>
              <span className="flex items-center gap-2 text-xs text-brand-ink-soft">
                {selected.size > 0 ? <span>{selected.size}</span> : null}
                <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="border-t border-border px-4 py-2">
              <input
                type="search"
                value={queries[group.key] ?? ''}
                onChange={(event) => onSearch(group.key, event.target.value)}
                placeholder={t('filterSearchPlaceholder', { facet: group.label })}
                className="mb-2 h-8 w-full rounded border border-border px-2 text-sm focus:border-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
              />
              <div className="max-h-56 overflow-y-auto">
                {visibleItems.length === 0 ? (
                  <p className="py-2 text-sm text-brand-ink-soft">{t('noFilterMatches')}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {visibleItems.map((item) => {
                      const isChecked = selected.has(item.value);
                      return (
                        <li key={item.value}>
                          <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-brand-ink hover:bg-brand-paper-soft">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                              checked={isChecked}
                              onChange={() => onToggle(group.paramKey, item.value)}
                            />
                            <span>{item.label}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </details>
        );
      })}

      <details open className="rounded-lg border border-border bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-brand-blue">
          <span>{t('filters.yearRange')}</span>
          <ChevronDown size={14} />
        </summary>
        <div className="border-t border-border px-4 py-3">
          <YearRangeFilter min={yearMin} max={yearMax} />
        </div>
      </details>
    </aside>
  );
}
