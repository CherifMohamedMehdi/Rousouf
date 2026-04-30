/**
 * Homepage — composed of six clearly-separated sections.
 *
 * Each section is its own server component under components/home/*, so
 * they can fetch their own data in parallel. The page itself is a thin
 * composition layer.
 */
import { setRequestLocale } from 'next-intl/server';
import Hero from '@/components/home/Hero';
import StatsRow from '@/components/home/StatsRow';
import ThemeTiles from '@/components/home/ThemeTiles';
import RecentAdditions from '@/components/home/RecentAdditions';
import PartnersStrip from '@/components/home/PartnersStrip';
import DonorsWall from '@/components/home/DonorsWall';
import { isLocale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <StatsRow />
      <ThemeTiles />
      <RecentAdditions />
      <PartnersStrip />
      <DonorsWall />
    </>
  );
}
