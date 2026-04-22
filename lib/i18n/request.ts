/**
 * next-intl request config.
 *
 * Loaded once per request by the server. Given a locale, it returns the
 * matching message catalog from /messages. The catalogs are plain JSON so
 * translators can open them in any editor.
 */
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  if (!isLocale(locale)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
