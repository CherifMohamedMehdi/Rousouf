/**
 * TransparencyNote — the "on trust and privacy" panel at the bottom of the
 * donate page. Copy comes from the Directus `pages` singleton
 * (`transparency_note_<locale>`) so the finance team can update it without
 * touching the codebase.
 */
import { getTranslations } from 'next-intl/server';

interface Props {
  note: string;
}

export default async function TransparencyNote({ note }: Props) {
  if (!note) return null;
  const t = await getTranslations('donate');

  return (
    <section
      aria-labelledby="transparency-heading"
      className="mt-10 rounded-xl border border-border bg-white p-5"
    >
      <h2 id="transparency-heading" className="text-lg font-semibold text-brand-blue">
        {t('transparencyHeading')}
      </h2>
      <p className="mt-2 text-sm text-brand-ink-soft">{note}</p>
    </section>
  );
}
