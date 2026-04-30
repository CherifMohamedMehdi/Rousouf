/**
 * DonorsWall — chips showing opted-in donor display names.
 *
 * Data flow:
 *   browser ➜ /api/donors/highlights?limit=30
 *     ⬇ returns PublicDonor[] (display_name + month only)
 *   browser renders chips
 *
 * The API is strict: only donations with `status = succeeded AND
 * is_anonymous = false AND display_on_homepage = true` are returned.
 * Amount, email, message, and provider_reference are never exposed.
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import type { PublicDonor } from '@/types/directus';
import Button from '@/components/ui/Button';

export default function DonorsWall() {
  const locale = useLocale();
  const t = useTranslations('home.donors');
  const [donors, setDonors] = useState<PublicDonor[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/donors/highlights?limit=30', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: { donors: PublicDonor[] }) => {
        if (!cancelled) setDonors(data.donors);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasDonors = donors && donors.length > 0;

  return (
    <section aria-labelledby="donors-heading" className="border-t border-border bg-white">
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <div className="flex items-center justify-center gap-2 text-brand-gold">
          <Heart size={18} aria-hidden="true" />
        </div>
        <h2 id="donors-heading" className="mt-2 text-2xl font-semibold text-brand-blue md:text-3xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-brand-ink-soft">{t('description')}</p>

        {error || !hasDonors ? (
          <p className="mt-8 text-sm italic text-brand-ink-soft">
            {t('emptyState')}
          </p>
        ) : (
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {donors!.map((d) => (
              <li
                key={d.id}
                className="rounded-full border border-brand-gold/30 bg-brand-gold-soft px-3 py-1 text-sm text-brand-ink"
              >
                {d.display_name}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <Link href={`/${locale}/donate`}>
            <Button variant="secondary">{t('becomeADonor')}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
