/**
 * /[locale]/about — mission, team, contact.
 *
 * Content comes from the Directus `pages` singleton (mission + about body)
 * and `team_members` collection. The contact form writes back to
 * `contact_messages` via /api/contact.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { getPages } from '@/lib/directus/pages';
import { getTeamMembers } from '@/lib/directus/teamMembers';
import TeamGrid from '@/components/about/TeamGrid';
import ContactForm from '@/components/about/ContactForm';
import { isLocale, type Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title') };
}

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('about');
  const [pages, team] = await Promise.all([getPages(), getTeamMembers()]);

  const mission = pages[`mission_${locale}` as const] ?? pages.mission_en ?? '';
  const aboutBody = pages[`about_body_${locale}` as const] ?? pages.about_body_en ?? '';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-12">
      <header>
        <h1 className="text-3xl font-semibold text-brand-blue md:text-4xl">{t('title')}</h1>
      </header>

      <section aria-labelledby="mission-heading">
        <h2 id="mission-heading" className="text-xl font-semibold text-brand-blue">
          {t('missionHeading')}
        </h2>
        {mission ? <p className="mt-3 text-base leading-relaxed text-brand-ink">{mission}</p> : null}
        {aboutBody ? (
          <div className="mt-4 space-y-4 text-base leading-relaxed text-brand-ink-soft">
            {aboutBody.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ) : null}
      </section>

      {team.length ? (
        <section aria-labelledby="team-heading">
          <h2 id="team-heading" className="text-xl font-semibold text-brand-blue">
            {t('teamHeading')}
          </h2>
          <div className="mt-4">
            <TeamGrid members={team} locale={locale as Locale} />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-xl font-semibold text-brand-blue">
          {t('contactHeading')}
        </h2>
        <div className="mt-4 rounded-xl border border-border bg-white p-6">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
