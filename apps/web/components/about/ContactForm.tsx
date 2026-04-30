/**
 * ContactForm — public contact form that writes to Directus
 * `contact_messages`. Includes a honeypot, client-side validation, and
 * the same success/error pattern as the suggestion modal.
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { isEmailLike } from '@/lib/utils';

type State = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const t = useTranslations('about.contact');
  const [state, setState] = useState<State>('idle');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !isEmailLike(email) || !message.trim()) {
      setState('error');
      return;
    }
    setState('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: subject || undefined,
          message,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (!res.ok) throw new Error('network');
      setState('success');
    } catch {
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <p className="rounded-lg border border-brand-teal/30 bg-brand-teal-soft p-4 text-sm text-brand-ink">
        {t('success')}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
            {t('name')}
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
            {t('email')}
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
          {t('subject')}
        </span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-ink-soft">
          {t('message')}
        </span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-brand-blue"
        />
      </label>
      {state === 'error' ? (
        <p role="alert" className="text-sm text-red-600">
          {t('error')}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" isLoading={state === 'submitting'}>
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
