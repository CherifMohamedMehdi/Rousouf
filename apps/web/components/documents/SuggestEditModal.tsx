/**
 * SuggestEditModal — shared correction dialog for documents and organizations.
 *
 * Submits to /api/suggestions with `target_type` + `(document_id | organization_id)`.
 * Uses the global <Modal> primitive for focus trapping + Esc handling.
 *
 * Includes a honeypot field (`company`) that real users never see. Bots that
 * auto-fill every input will trip it and be silently rejected server-side.
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { SuggestionTargetType } from '@/types/directus';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

interface Props {
  open: boolean;
  onClose: () => void;
  targetType: SuggestionTargetType;
  targetId: string;
  fieldName: string;
  fieldLabel: string;
  currentValue: string;
}

type State = 'idle' | 'submitting' | 'success' | 'error';

export default function SuggestEditModal({
  open,
  onClose,
  targetType,
  targetId,
  fieldName,
  fieldLabel,
  currentValue,
}: Props) {
  const t = useTranslations('suggest');
  const [state, setState] = useState<State>('idle');
  const [suggestedValue, setSuggestedValue] = useState(currentValue);
  const [note, setNote] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          field_name: fieldName,
          field_label: fieldLabel,
          current_value: currentValue,
          suggested_value: suggestedValue,
          note,
          email,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (!res.ok) throw new Error('network');
      setState('success');
    } catch {
      setState('error');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('title')} widthClassName="max-w-lg">
      {state === 'success' ? (
        <div className="space-y-4">
          <p className="text-sm text-brand-ink">{t('success')}</p>
          <div className="flex justify-end">
            <Button onClick={onClose}>{t('close')}</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-brand-ink-soft">{t('subtitle')}</p>

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

          <div>
            <label className="block text-sm font-medium text-brand-ink">
              {t('fieldLabel')}
            </label>
            <p className="mt-1 rounded border border-border bg-brand-paper-soft px-3 py-2 text-sm text-brand-ink-soft">
              {fieldLabel}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink">
              {t('currentLabel')}
            </label>
            <p className="mt-1 rounded border border-border bg-brand-paper-soft px-3 py-2 text-sm text-brand-ink">
              {currentValue || '—'}
            </p>
          </div>

          <div>
            <label htmlFor="sug-value" className="block text-sm font-medium text-brand-ink">
              {t('suggestedLabel')}
            </label>
            <textarea
              id="sug-value"
              value={suggestedValue}
              onChange={(e) => setSuggestedValue(e.target.value)}
              required
              rows={3}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
            />
          </div>

          <div>
            <label htmlFor="sug-note" className="block text-sm font-medium text-brand-ink">
              {t('noteLabel')}
            </label>
            <textarea
              id="sug-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-brand-blue"
            />
          </div>

          <div>
            <label htmlFor="sug-email" className="block text-sm font-medium text-brand-ink">
              {t('emailLabel')}
            </label>
            <input
              id="sug-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:border-brand-blue"
            />
          </div>

          {state === 'error' ? (
            <p role="alert" className="text-sm text-red-600">
              {t('error')}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" isLoading={state === 'submitting'}>
              {state === 'submitting' ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
