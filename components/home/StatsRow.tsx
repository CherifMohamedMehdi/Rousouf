/**
 * Three-stat row: total documents, total orgs, year range.
 * Numbers come straight from lib/directus/documents.ts#getSiteStats().
 */
import { getLocale, getTranslations } from 'next-intl/server';
import { getSiteStats } from '@/lib/directus/documents';

export default async function StatsRow() {
  const locale = await getLocale();
  const t = await getTranslations('home.stats');
  const stats = await getSiteStats();
  const formatter = new Intl.NumberFormat(locale);

  const items = [
    { label: t('documents'), value: formatter.format(stats.total_documents) },
    { label: t('organizations'), value: formatter.format(stats.total_organizations) },
    { label: t('yearsCovered'), value: `${stats.earliest_year} – ${stats.latest_year}` },
  ];

  return (
    <section aria-labelledby="stats-heading" className="border-y border-border bg-brand-paper-soft">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h2 id="stats-heading" className="sr-only">
          {t('title')}
        </h2>
        <dl className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
          {items.map((s) => (
            <div key={s.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
                {s.label}
              </dt>
              <dd className="mt-1 font-sans text-3xl font-semibold text-brand-blue md:text-4xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
