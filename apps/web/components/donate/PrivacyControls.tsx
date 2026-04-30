/**
 * PrivacyControls — two paired toggles for the donate flow:
 *  (a) "Donate anonymously" — skip storing name/email with the donation.
 *  (b) "Show my name on the donors wall" — opt in to the homepage list.
 *
 * When (a) is on, (b) is automatically disabled and cleared. A free-form
 * `Display name` input lets the donor choose how they appear.
 */
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';

export interface PrivacyValue {
  isAnonymous: boolean;
  displayOnHomepage: boolean;
  publicDisplayName: string;
}

interface Props {
  value: PrivacyValue;
  onChange(next: PrivacyValue): void;
}

export default function PrivacyControls({ value, onChange }: Props) {
  const t = useTranslations('donate.form');

  useEffect(() => {
    if (value.isAnonymous && (value.displayOnHomepage || value.publicDisplayName)) {
      onChange({ ...value, displayOnHomepage: false, publicDisplayName: '' });
    }
  }, [value, onChange]);

  return (
    <fieldset className="rounded-xl border border-border bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-brand-blue">{t('privacyHeading')}</legend>

      <label className="flex items-start gap-3 py-2">
        <input
          type="checkbox"
          checked={value.isAnonymous}
          onChange={(e) => onChange({ ...value, isAnonymous: e.target.checked })}
          className="mt-1 h-4 w-4 rounded border-border text-brand-blue"
        />
        <span>
          <span className="block text-sm font-medium text-brand-ink">{t('anonymousLabel')}</span>
          <span className="block text-xs text-brand-ink-soft">{t('anonymousHint')}</span>
        </span>
      </label>

      <label className="flex items-start gap-3 py-2">
        <input
          type="checkbox"
          disabled={value.isAnonymous}
          checked={value.displayOnHomepage}
          onChange={(e) => onChange({ ...value, displayOnHomepage: e.target.checked })}
          className="mt-1 h-4 w-4 rounded border-border text-brand-blue disabled:opacity-40"
        />
        <span>
          <span className="block text-sm font-medium text-brand-ink">{t('displayLabel')}</span>
          <span className="block text-xs text-brand-ink-soft">{t('displayHint')}</span>
        </span>
      </label>

      {value.displayOnHomepage && !value.isAnonymous ? (
        <label className="mt-2 block">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
            {t('displayNameLabel')}
            <Badge tone="gold">public</Badge>
          </span>
          <input
            value={value.publicDisplayName}
            onChange={(e) => onChange({ ...value, publicDisplayName: e.target.value })}
            placeholder={t('displayNamePlaceholder')}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
          />
        </label>
      ) : null}
    </fieldset>
  );
}
