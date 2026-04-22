/**
 * Locale-scoped 404 page.
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import Button from '@/components/ui/Button';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('errors');
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-semibold text-brand-gold">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-brand-blue md:text-4xl">{t('notFound')}</h1>
      <div className="mt-8">
        <Link href={`/${locale}`}>
          <Button>{t('backHome')}</Button>
        </Link>
      </div>
    </div>
  );
}
