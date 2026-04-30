/**
 * /[locale]/search — the canonical browse surface.
 *
 * Entirely URL-driven: every filter, the query, the sort mode, and the
 * current page are encoded in query-string params. This makes each result
 * state deeply shareable and bookmarkable.
 *
 * Data flow:
 *   URL ➜ parseSearchParams() ➜ search() (Meilisearch | mock)
 *         + getThemes/getDocumentTypes/... for the sidebar
 *   ➜ render FilterSidebar (client) + ResultCard list (server)
 */
import { Suspense } from 'react';
import { setRequestLocale, getTranslations, getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import FilterSidebar from '@/components/search/FilterSidebar';
import ActiveFilterChips, { type Chip } from '@/components/search/ActiveFilterChips';
import SortDropdown from '@/components/search/SortDropdown';
import PageSizeSelect from '@/components/search/PageSizeSelect';
import ExportButton from '@/components/search/ExportButton';
import ResultCard from '@/components/search/ResultCard';
import Pagination from '@/components/search/Pagination';
import NoResults from '@/components/search/NoResults';
import SearchBar from '@/components/search/SearchBar';

import { getDocuments, getSiteStats } from '@/lib/directus/documents';
import { getSearchFacets } from '@/lib/directus/searchFacets';
import { search, type SearchResult } from '@/lib/search/meilisearch';
import { parseSearchParams } from '@/lib/search/urlParams';
import { isLocale, type Locale } from '@/lib/i18n/config';

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'search' });
  return { title: t('title') };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const parsed = parseSearchParams(resolvedSearchParams);
  const tSearch = await getTranslations('search');

  const [facets, stats] = await Promise.all([
    getSearchFacets(locale as Locale),
    getSiteStats(),
  ]);

  let results: SearchResult;
  if (parsed.q || parsed.sort === 'relevant') {
    results = await search({
      q: parsed.q ?? '',
      themeSlugs: parsed.themeSlugs,
      typeSlugs: parsed.typeSlugs,
      governorateSlugs: parsed.governorateSlugs,
      languageSlugs: parsed.languageSlugs,
      organizationSlugs: parsed.organizationSlugs,
      yearFrom: parsed.yearFrom,
      yearTo: parsed.yearTo,
      dynamicFilters: parsed.dynamicFilters,
      limit: parsed.pageSize,
      offset: parsed.offset,
      listSort: parsed.sort,
    });
  } else {
    const page = await getDocuments({
      themeSlugs: parsed.themeSlugs,
      typeSlugs: parsed.typeSlugs,
      governorateSlugs: parsed.governorateSlugs,
      languageSlugs: parsed.languageSlugs,
      organizationSlugs: parsed.organizationSlugs,
      yearFrom: parsed.yearFrom,
      yearTo: parsed.yearTo,
      dynamicFilters: parsed.dynamicFilters,
      sort: parsed.sort === 'oldest' ? 'oldest' : 'recent',
      limit: parsed.pageSize,
      offset: parsed.offset,
    });
    results = {
      hits: page.items.map((d) => ({ document: d, score: 1 })),
      total: page.total,
      query: '',
    };
  }

  const totalPages = Math.max(1, Math.ceil(results.total / parsed.pageSize));
  const chips = buildChips({ parsed, facets });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold text-brand-blue md:text-4xl">{tSearch('title')}</h1>
        <Suspense fallback={<div className="h-11 w-full rounded-lg border border-border bg-white/70" aria-hidden="true" />}>
          <SearchBar initialQuery={parsed.q ?? ''} />
        </Suspense>
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-[260px_minmax(0,1fr)]">
        <Suspense>
          <FilterSidebar
            facets={facets}
            yearMin={stats.earliest_year}
            yearMax={stats.latest_year}
          />
        </Suspense>

        <section aria-label="Search results">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-brand-ink-soft">
              {tSearch('resultsCount', { count: results.total })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Suspense fallback={null}>
                <ExportButton total={results.total} />
              </Suspense>
              <Suspense fallback={null}>
                <PageSizeSelect current={parsed.pageSize} />
              </Suspense>
              <Suspense fallback={null}>
                <SortDropdown />
              </Suspense>
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="mt-4">
              <Suspense fallback={null}>
                <ActiveFilterChips chips={chips.map((c) => ({ paramKey: c.paramKey, value: c.value, label: c.label }))} />
              </Suspense>
            </div>
          ) : null}

          <div className="mt-6">
            {results.total === 0 ? (
              <NoResults />
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {results.hits.map((hit) => (
                    <li key={hit.document.id}>
                      <ResultCard
                        document={hit.document}
                        variant="full"
                        highlightedTitle={hit.highlightedTitle}
                        highlightedSnippet={hit.highlightedSnippet}
                      />
                    </li>
                  ))}
                </ul>
                <Suspense fallback={null}>
                  <Pagination page={parsed.page} totalPages={totalPages} />
                </Suspense>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function buildChips({
  parsed,
  facets,
}: {
  parsed: ReturnType<typeof parseSearchParams>;
  facets: Awaited<ReturnType<typeof getSearchFacets>>;
}): (Chip & { paramKey: string })[] {
  const out: (Chip & { paramKey: string })[] = [];
  const push = (paramKey: string, value: string, label: string) =>
    out.push({ paramKey, value, label });

  for (const facet of facets) {
    const values = facet.paramKey in parsed.dynamicFilters
      ? parsed.dynamicFilters[facet.paramKey]
      : (() => {
          if (facet.paramKey === 'themes') return parsed.themeSlugs ?? [];
          if (facet.paramKey === 'types') return parsed.typeSlugs ?? [];
          if (facet.paramKey === 'governorates') return parsed.governorateSlugs ?? [];
          if (facet.paramKey === 'languages') return parsed.languageSlugs ?? [];
          if (facet.paramKey === 'orgs') return parsed.organizationSlugs ?? [];
          return [];
        })();
    for (const value of values) {
      const hit = facet.options.find((x) => x.value === value);
      push(facet.paramKey, value, hit?.label ?? value);
    }
  }
  if (parsed.yearFrom) push('yearFrom', String(parsed.yearFrom), `≥ ${parsed.yearFrom}`);
  if (parsed.yearTo) push('yearTo', String(parsed.yearTo), `≤ ${parsed.yearTo}`);
  return out;
}
