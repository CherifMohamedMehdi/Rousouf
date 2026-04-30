/**
 * PartnersStrip — institutional supporters, grouped by tier.
 *
 * Each logo link opens in a new tab with `rel="noopener noreferrer"`.
 * Logos are grayscale by default, full-color on hover/focus, and the
 * treatment respects `prefers-reduced-motion` via globals.css.
 */
import { getTranslations } from 'next-intl/server';
import { getPartners } from '@/lib/directus/partners';
import type { Partner, PartnerTier } from '@/types/directus';

const TIER_ORDER: PartnerTier[] = ['strategic', 'supporting', 'media'];

export default async function PartnersStrip() {
  const t = await getTranslations('home.partners');
  const partners = await getPartners({ onlyHomepage: true });
  if (!partners.length) return null;

  const groups: Record<PartnerTier, Partner[]> = {
    strategic: [],
    supporting: [],
    media: [],
  };
  for (const p of partners) groups[p.tier].push(p);

  return (
    <section aria-labelledby="partners-heading" className="border-t border-border bg-brand-paper-soft">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center">
          <h2 id="partners-heading" className="text-2xl font-semibold text-brand-blue md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-brand-ink-soft">{t('description')}</p>
        </div>

        <div className="mt-10 space-y-10">
          {TIER_ORDER.map((tier) =>
            groups[tier].length ? (
              <div key={tier}>
                <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
                  {t(
                    tier === 'strategic'
                      ? 'tierStrategic'
                      : tier === 'supporting'
                        ? 'tierSupporting'
                        : 'tierMedia',
                  )}
                </h3>
                <ul
                  className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6"
                  aria-label={t(
                    tier === 'strategic'
                      ? 'tierStrategic'
                      : tier === 'supporting'
                        ? 'tierSupporting'
                        : 'tierMedia',
                  )}
                >
                  {groups[tier].map((p) => (
                    <li key={p.id}>
                      <a
                        href={p.website ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={p.name}
                        className="group flex h-14 items-center px-3"
                      >
                        {p.logo?.url ? (
                          <img
                            src={p.logo.url}
                            alt={p.name}
                            className="h-full w-auto max-w-[160px] grayscale opacity-80 transition-all group-hover:grayscale-0 group-hover:opacity-100 group-focus:grayscale-0 group-focus:opacity-100"
                          />
                        ) : (
                          <span className="text-sm font-medium text-brand-ink-soft">{p.name}</span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}
