/**
 * i18n config — the single source of truth for which locales Roufouf
 * supports, what the default is, and which direction each one renders in.
 *
 * How to edit:
 * - To add a locale, append its code to `locales` and its direction to
 *   `localeDirections`. Also add a matching `messages/<code>.json` file.
 *   `pnpm build` runs `scripts/sync-middleware-matcher.ts` (prebuild) so
 *   `middleware.ts` stays in sync — or run `pnpm sync-middleware-matcher`.
 * - The homepage wordmark + layout picks up `dir` automatically via
 *   <html dir>.
 */
export const locales = ['ar', 'fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  ar: 'rtl',
  fr: 'ltr',
  en: 'ltr',
};

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  fr: 'Français',
  en: 'English',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
