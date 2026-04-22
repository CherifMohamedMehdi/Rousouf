/**
 * Routing + locale middleware.
 *
 * Responsibilities:
 * - Redirect "/" to the user's preferred locale (persisted in a cookie, or
 *   detected from Accept-Language).
 * - Ensure every public path lives under /<locale>/… so the layout can pick
 *   the right language + direction.
 *
 * Locales are defined in lib/i18n/config.ts.
 */
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './lib/i18n/config';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, and API/well-known paths.
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
