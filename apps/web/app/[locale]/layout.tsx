/**
 * Locale-scoped layout. Every public route lives under /<locale> (ar/fr/en).
 *
 * Responsibilities:
 * - Sets <html lang> and <html dir> so RTL/LTR work correctly.
 * - Loads IBM Plex Sans + IBM Plex Sans Arabic via next/font and exposes them
 *   as CSS variables for Tailwind's font stack.
 * - Wraps children in the next-intl provider so every server + client
 *   component can use useTranslations().
 * - Mounts the shared Header + Footer and the accessibility skip link.
 *
 * How to edit:
 * - Keep this file tiny. Put page-level UI in components/, not here.
 * - To add a locale, edit lib/i18n/config.ts and add a matching messages/*.
 */
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SkipLink from '@/components/a11y/SkipLink';
import Analytics from '@/components/layout/Analytics';
import { BrandingProvider } from '@/components/layout/BrandingProvider';
import { locales, localeDirections, isLocale, type Locale } from '@/lib/i18n/config';
import { getBrandingPresentation } from '@/lib/directus/brandingSettings';

function hexToRgbTriplet(hex: string): string {
  const trimmed = hex.trim();
  const normalized =
    trimmed.length === 4
      ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
      : trimmed;
  const n = normalized.replace('#', '');
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex-sans-arabic',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#F7F5F0',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteUrlRaw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  let metadataBase: URL;
  try {
    metadataBase = new URL(siteUrlRaw);
  } catch {
    metadataBase = new URL('http://localhost:3000');
  }
  return {
    metadataBase,
    title: {
      default: `${t('siteName')} — ${t('tagline')}`,
      template: `%s · ${t('siteName')}`,
    },
    description: t('description'),
    openGraph: {
      title: `${t('siteName')} — ${t('tagline')}`,
      description: t('description'),
      type: 'website',
      locale,
      siteName: t('siteName'),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('siteName')} — ${t('tagline')}`,
      description: t('description'),
    },
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const branding = await getBrandingPresentation();
  const direction = localeDirections[locale as Locale];
  const style = {
    '--brand-blue-rgb': hexToRgbTriplet(branding.palette.primary),
    '--brand-blue-dark-rgb': hexToRgbTriplet(branding.palette.primary),
    '--brand-blue-soft-rgb': hexToRgbTriplet(branding.palette.background),
    '--brand-gold-rgb': hexToRgbTriplet(branding.palette.secondary),
    '--brand-gold-dark-rgb': hexToRgbTriplet(branding.palette.secondary),
    '--brand-gold-soft-rgb': hexToRgbTriplet(branding.palette.background),
    '--brand-paper-rgb': hexToRgbTriplet(branding.palette.background),
    '--brand-paper-soft-rgb': hexToRgbTriplet(branding.palette.background),
    '--brand-ink-rgb': hexToRgbTriplet(branding.palette.text),
    '--brand-ink-soft-rgb': hexToRgbTriplet(branding.palette.text),
    '--brand-teal-rgb': hexToRgbTriplet(branding.palette.secondary),
    '--brand-teal-soft-rgb': hexToRgbTriplet(branding.palette.background),
    '--background-rgb': hexToRgbTriplet(branding.palette.background),
    '--foreground-rgb': hexToRgbTriplet(branding.palette.text),
    '--muted-rgb': hexToRgbTriplet(branding.palette.background),
    '--muted-foreground-rgb': hexToRgbTriplet(branding.palette.text),
    '--border-rgb': hexToRgbTriplet(branding.palette.border),
    '--ring-rgb': hexToRgbTriplet(branding.palette.secondary),
  } as React.CSSProperties;

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${plexSans.variable} ${plexSansArabic.variable}`}
      style={style}
    >
      <body className="min-h-screen bg-background text-foreground">
        <BrandingProvider value={branding}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <SkipLink />
            <Header />
            <main id="main" className="min-h-[60vh]">
              {children}
            </main>
            <Footer />
            <Analytics />
          </NextIntlClientProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
