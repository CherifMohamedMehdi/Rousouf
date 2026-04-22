/**
 * DonationTierPicker — suggested amount tiles + free-form custom amount.
 *
 * Amounts adapt to the selected currency (TND/USD/EUR) using the per-tier
 * fields configured in Directus. The impact description is shown beneath
 * the active tier so donors understand what each tier unlocks.
 */
'use client';

import { useTranslations } from 'next-intl';
import type { CurrencyCode, DonationTier } from '@/types/directus';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface Props {
  tiers: DonationTier[];
  currency: CurrencyCode;
  amount: number | null;
  tierId: string | null;
  onSelect(tierId: string | null, amount: number): void;
  locale: Locale;
}

const CURRENCY_AMOUNT_FIELD: Record<CurrencyCode, keyof DonationTier> = {
  TND: 'amount_tnd',
  USD: 'amount_usd',
  EUR: 'amount_eur',
};

export default function DonationTierPicker({
  tiers,
  currency,
  amount,
  tierId,
  onSelect,
  locale,
}: Props) {
  const t = useTranslations('donate');

  function amountFor(tier: DonationTier) {
    const value = tier[CURRENCY_AMOUNT_FIELD[currency]];
    return typeof value === 'number' ? value : 0;
  }

  const format = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-brand-blue">{t('chooseAmount')}</legend>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {tiers.map((tier) => {
          const value = amountFor(tier);
          const label = tier[`label_${locale}` as const] ?? tier.label_en ?? '';
          const selected = tierId === tier.id;
          return (
            <button
              type="button"
              key={tier.id}
              onClick={() => onSelect(tier.id, value)}
              className={cn(
                'flex flex-col items-start rounded-lg border bg-white px-3 py-3 text-start transition-colors',
                selected
                  ? 'border-brand-blue bg-brand-blue-soft text-brand-blue'
                  : 'border-border text-brand-ink hover:border-brand-blue',
              )}
            >
              <span className="text-lg font-semibold">{format.format(value)}</span>
              {label ? <span className="text-xs text-brand-ink-soft">{label}</span> : null}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
          {t('customAmount')}
        </span>
        <input
          type="number"
          min={1}
          step="1"
          value={tierId === null && amount !== null ? amount : ''}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v) || v <= 0) onSelect(null, 0);
            else onSelect(null, v);
          }}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
        />
      </label>
    </fieldset>
  );
}
