/**
 * next-intl request config.
 *
 * Loaded once per request by the server. Given a locale, it returns the
 * matching message catalog from /messages. The catalogs are plain JSON so
 * translators can open them in any editor.
 */
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale } from './config';
import arMessages from '../../messages/ar.json';
import frMessages from '../../messages/fr.json';
import enMessages from '../../messages/en.json';

const MESSAGES = {
  ar: arMessages,
  fr: frMessages,
  en: enMessages,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: MESSAGES[locale],
  };
});
