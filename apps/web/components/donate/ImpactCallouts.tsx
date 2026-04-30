/**
 * ImpactCallouts — the three short "what your donation funds" tiles on the
 * donate page.
 *
 * Copy is driven by the Directus `pages` singleton (`impact_callouts_<locale>`),
 * so editors can reshape the pitch without a code change. The component
 * gracefully renders nothing when there are no active callouts.
 */
import { getTranslations } from 'next-intl/server';
import type { ImpactCallout } from '@/types/directus';

interface Props {
  callouts: ImpactCallout[];
}

export default async function ImpactCallouts({ callouts }: Props) {
  if (!callouts.length) return null;
  const t = await getTranslations('donate');

  return (
    <section aria-labelledby="impact-heading" className="mt-10">
      <h2 id="impact-heading" className="text-lg font-semibold text-brand-blue">
        {t('impactHeading')}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {callouts.map((c, i) => (
          <li key={i} className="rounded-xl border border-border bg-white p-4">
            <p className="text-sm font-semibold text-brand-blue">{c.title}</p>
            <p className="mt-1 text-sm text-brand-ink-soft">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
