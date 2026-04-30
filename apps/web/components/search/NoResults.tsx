/**
 * NoResults — empty state shown when a search returns no documents.
 *
 * Recovery options, in priority order:
 *  1. Link to /submit so the user can contribute a missing document.
 *  2. Link to the unfiltered /search so they can try again from scratch.
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import Button from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default async function NoResults() {
  const locale = await getLocale();
  const t = await getTranslations('search.noResults');
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-white p-10 text-center">
      <FileQuestion aria-hidden="true" className="text-brand-ink-soft" size={40} />
      <h2 className="mt-3 text-xl font-semibold text-brand-blue">{t('title')}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-brand-ink-soft">{t('body')}</p>
      <div className="mt-5 flex gap-3">
        <Link href={`/${locale}/submit`}>
          <Button variant="primary">{t('cta')}</Button>
        </Link>
        <Link href={`/${locale}/search`}>
          <Button variant="ghost">Reset filters</Button>
        </Link>
      </div>
    </div>
  );
}
