/**
 * DonateForm — the full donate flow, built UI-first.
 *
 * Steps:
 *  1. Currency + frequency (one-time vs monthly).
 *  2. Amount (tier or custom).
 *  3. Donor info (name / email / message) with a honeypot.
 *  4. Privacy toggles (anonymous / show on homepage / display name).
 *
 * Submit posts to /api/donate/intent. The backend chooses the active
 * payment provider; if it returns `provider_not_configured`, we show the
 * "payments aren't live yet" thank-you state. When a real provider is
 * wired in later, the same client code handles the `redirect` / `embed`
 * kinds automatically.
 */
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import DonationTierPicker from './DonationTierPicker';
import PrivacyControls, { type PrivacyValue } from './PrivacyControls';
import type { CurrencyCode, DonationFrequency, DonationTier } from '@/types/directus';
import type { Locale } from '@/lib/i18n/config';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

interface Props {
  tiers: DonationTier[];
}

type Result =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'provider_not_configured' }
  | { kind: 'thank_you' }
  | { kind: 'error'; message: string };

const CURRENCIES: CurrencyCode[] = ['TND', 'USD', 'EUR'];

export default function DonateForm({ tiers }: Props) {
  const t = useTranslations('donate');
  const tForm = useTranslations('donate.form');
  const locale = useLocale() as Locale;

  const [currency, setCurrency] = useState<CurrencyCode>('TND');
  const [frequency, setFrequency] = useState<DonationFrequency>('one_time');
  const [tierId, setTierId] = useState<string | null>(tiers[0]?.id ?? null);
  const [amount, setAmount] = useState<number | null>(
    tiers[0] ? (tiers[0].amount_tnd as number) : null,
  );
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyValue>({
    isAnonymous: false,
    displayOnHomepage: false,
    publicDisplayName: '',
  });
  const [result, setResult] = useState<Result>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setResult({ kind: 'submitting' });
    try {
      const res = await fetch('/api/donate/intent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          frequency,
          tierId,
          donorName: privacy.isAnonymous ? undefined : donorName,
          donorEmail: privacy.isAnonymous ? undefined : donorEmail,
          message,
          isAnonymous: privacy.isAnonymous,
          displayOnHomepage: privacy.displayOnHomepage,
          publicDisplayName: privacy.publicDisplayName || donorName,
          locale,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (!res.ok) throw new Error('intent_failed');
      const data = await res.json();
      if (data.kind === 'redirect' && data.url) {
        window.location.href = data.url as string;
        return;
      }
      if (data.kind === 'provider_not_configured') {
        setResult({ kind: 'provider_not_configured' });
        return;
      }
      setResult({ kind: 'thank_you' });
    } catch (err) {
      setResult({ kind: 'error', message: err instanceof Error ? err.message : 'error' });
    }
  }

  if (result.kind === 'provider_not_configured') {
    return (
      <div className="rounded-xl border border-brand-teal/30 bg-brand-teal-soft p-8 text-center">
        <h2 className="text-xl font-semibold text-brand-blue">{t('disabled.title')}</h2>
        <p className="mt-2 text-sm text-brand-ink-soft">{t('disabled.body')}</p>
      </div>
    );
  }

  if (result.kind === 'thank_you') {
    return (
      <div className="rounded-xl border border-brand-teal/30 bg-brand-teal-soft p-8 text-center">
        <h2 className="text-xl font-semibold text-brand-blue">{t('thankYou.title')}</h2>
        <p className="mt-2 text-sm text-brand-ink-soft">{t('thankYou.body')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
            {t('currency')}
          </span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
            {t('frequency')}
          </legend>
          <div className="mt-1 inline-flex rounded-lg border border-border bg-white p-1">
            <button
              type="button"
              onClick={() => setFrequency('one_time')}
              aria-pressed={frequency === 'one_time'}
              className={`rounded-md px-3 py-1.5 text-sm ${frequency === 'one_time' ? 'bg-brand-blue text-white' : 'text-brand-ink-soft'}`}
            >
              {t('oneTime')}
            </button>
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              aria-pressed={frequency === 'monthly'}
              className={`rounded-md px-3 py-1.5 text-sm ${frequency === 'monthly' ? 'bg-brand-blue text-white' : 'text-brand-ink-soft'}`}
            >
              {t('monthly')}
            </button>
          </div>
        </fieldset>
      </div>

      <DonationTierPicker
        tiers={tiers}
        currency={currency}
        amount={amount}
        tierId={tierId}
        locale={locale}
        onSelect={(id, value) => {
          setTierId(id);
          setAmount(value);
        }}
      />

      <PrivacyControls value={privacy} onChange={setPrivacy} />

      {!privacy.isAnonymous ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
              {tForm('name')}
            </span>
            <input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
            />
          </label>
          <label>
            <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
              {tForm('email')}
            </span>
            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
            />
          </label>
        </div>
      ) : null}

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
          {tForm('message')}
        </span>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-brand-blue"
        />
      </label>

      <input
        type="text"
        name={HONEYPOT_FIELD}
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {result.kind === 'error' ? (
        <p role="alert" className="text-sm text-red-600">
          {result.message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full md:w-auto"
        isLoading={result.kind === 'submitting'}
        disabled={!amount}
      >
        {tForm('submit')}
      </Button>
    </form>
  );
}
