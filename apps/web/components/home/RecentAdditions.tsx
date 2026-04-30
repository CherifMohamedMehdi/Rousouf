/**
 * Six most-recently-uploaded published documents.
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { getRecentDocuments } from '@/lib/directus/documents';
import DocumentCard from '@/components/search/ResultCard';
import type { Locale } from '@/lib/i18n/config';

export default async function RecentAdditions() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('home.recent');
  const docs = await getRecentDocuments(6);

  return (
    <section aria-labelledby="recent-heading" className="bg-brand-paper-soft">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-heading" className="text-2xl font-semibold text-brand-blue md:text-3xl">
            {t('title')}
          </h2>
          <Link
            href={`/${locale}/search`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-brand-blue-dark"
          >
            {t('viewAll')}
            <ArrowRight size={14} aria-hidden="true" className="rtl:-scale-x-100" />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <li key={doc.id}>
              <DocumentCard document={doc} variant="compact" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
