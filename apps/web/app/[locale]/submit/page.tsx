/**
 * /[locale]/submit — the contribute-a-document surface.
 *
 * The page itself is a server component that fetches taxonomies once and
 * hands them to the interactive <SubmitForm> client component.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import SubmitForm from '@/components/submit/SubmitForm';
import {
  getDocumentTypes,
  getGovernorates,
  getLanguages,
  getThemes,
} from '@/lib/directus/taxonomies';
import { getOrganizations } from '@/lib/directus/organizations';
import { isLocale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'submit' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function SubmitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [themes, documentTypes, governorates, languages, organizations] = await Promise.all([
    getThemes(),
    getDocumentTypes(),
    getGovernorates(),
    getLanguages(),
    getOrganizations(),
  ]);

  const t = await getTranslations('submit');

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-brand-blue md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-base text-brand-ink-soft">{t('subtitle')}</p>
      </header>
      <SubmitForm
        themes={themes}
        documentTypes={documentTypes}
        governorates={governorates}
        languages={languages}
        organizations={organizations}
      />
    </div>
  );
}
