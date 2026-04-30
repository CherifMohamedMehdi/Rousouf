'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { pickLabel } from '@/lib/i18n/taxonomy';
import type { Locale } from '@/lib/i18n/config';
import { isLocale } from '@/lib/i18n/config';

export interface TranslationLanguageOption {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentLanguageId: string | null;
  languages: TranslationLanguageOption[];
}

type ProcessState = 'idle' | 'processing' | 'ready' | 'error';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 50);

export default function SuggestTranslationModal({
  open,
  onClose,
  documentId,
  documentLanguageId,
  languages,
}: Props) {
  const t = useTranslations('suggestTranslation');
  const localeRaw = useLocale();
  const locale = (isLocale(localeRaw) ? localeRaw : 'en') as Locale;

  const languageChoices = useMemo(
    () =>
      documentLanguageId ? languages.filter((l) => l.id !== documentLanguageId) : [...languages],
    [languages, documentLanguageId],
  );

  const [languageId, setLanguageId] = useState(() => languageChoices[0]?.id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [processError, setProcessError] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitErrorCode, setSubmitErrorCode] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    if (!open) return;
    setLanguageId(languageChoices[0]?.id ?? '');
    setFile(null);
    setProcessState('idle');
    setProcessError(null);
    setFileHash('');
    setFingerprint('');
    setSubmitState('idle');
    setSubmitErrorCode(null);
    setNote('');
    setEmail('');
    setHoneypot('');
  }, [open, languageChoices]);

  const resetForClose = useCallback(() => {
    setLanguageId(languageChoices[0]?.id ?? '');
    setFile(null);
    setProcessState('idle');
    setProcessError(null);
    setFileHash('');
    setFingerprint('');
    setSubmitState('idle');
    setSubmitErrorCode(null);
    setNote('');
    setEmail('');
    setHoneypot('');
  }, [languageChoices]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      setProcessError(null);
      if (!f) {
        setFile(null);
        setProcessState('idle');
        setFileHash('');
        setFingerprint('');
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setFile(null);
        setProcessState('error');
        setProcessError('too_large');
        return;
      }
      const mime = f.type || '';
      if (mime !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        setFile(null);
        setProcessState('error');
        setProcessError('invalid_pdf');
        return;
      }

      setFile(f);
      setProcessState('processing');
      try {
        const { extractPdfText } = await import('@/lib/pdf/extract');
        const { sha256File } = await import('@/lib/pdf/hash');
        const { buildFingerprint } = await import('@/lib/pdf/fingerprint');
        const extract = await extractPdfText(f);
        const hash = await sha256File(f);
        const fp = buildFingerprint(extract.text);
        setFileHash(hash);
        setFingerprint(fp);
        setProcessState('ready');
      } catch {
        setFile(null);
        setFileHash('');
        setFingerprint('');
        setProcessState('error');
        setProcessError('processing_failed');
      }
    },
    [],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !languageId || !fileHash || processState !== 'ready') return;
    setSubmitState('submitting');
    setSubmitErrorCode(null);
    try {
      const form = new FormData();
      form.set('document_id', documentId);
      form.set('language_id', languageId);
      form.set('file_hash', fileHash);
      form.set('content_fingerprint', fingerprint);
      if (note) form.set('note', note);
      if (email) form.set('email', email);
      form.set('file', file);
      form.set(HONEYPOT_FIELD, honeypot);

      const res = await fetch('/api/translation-suggestions', { method: 'POST', body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmitErrorCode(body.error ?? 'network');
        setSubmitState('error');
        return;
      }
      setSubmitState('success');
    } catch {
      setSubmitErrorCode('network');
      setSubmitState('error');
    }
  }

  const canSubmit =
    Boolean(file && languageId && fileHash && fingerprint) && processState === 'ready' && submitState !== 'success';

  return (
    <Modal open={open} onClose={onClose} title={t('title')} widthClassName="max-w-lg">
      {submitState === 'success' ? (
        <div className="space-y-4">
          <p className="text-sm text-brand-ink">{t('success')}</p>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetForClose();
                onClose();
              }}
            >
              {t('close')}
            </Button>
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
            <label htmlFor="tr-lang" className="block text-sm font-medium text-brand-ink">
              {t('languageLabel')}
            </label>
            <select
              id="tr-lang"
              value={languageId}
              onChange={(e) => setLanguageId(e.target.value)}
              required
              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:border-brand-blue"
            >
              {languageChoices.length === 0 ? (
                <option value="">{t('noLanguageChoice')}</option>
              ) : null}
              {languageChoices.map((l) => (
                <option key={l.id} value={l.id}>
                  {pickLabel(l, locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tr-file" className="block text-sm font-medium text-brand-ink">
              {t('fileLabel')}
            </label>
            <p className="mt-0.5 text-xs text-brand-ink-soft">{t('fileHint', { mb: MAX_MB })}</p>
            <input
              id="tr-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={onFileChange}
              className="mt-1 block w-full text-sm text-brand-ink file:me-3 file:rounded-md file:border-0 file:bg-brand-blue-soft file:px-3 file:py-2 file:text-brand-blue"
            />
            {processState === 'processing' ? (
              <p className="mt-1 text-xs text-brand-ink-soft">{t('processing')}</p>
            ) : null}
            {processState === 'error' && processError ? (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {processError === 'invalid_pdf'
                  ? t('errors.invalid_pdf')
                  : processError === 'too_large'
                    ? t('errors.too_large')
                    : processError === 'processing_failed'
                      ? t('errors.processing_failed')
                      : t('errors.generic')}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="tr-note" className="block text-sm font-medium text-brand-ink">
              {t('noteLabel')}
            </label>
            <textarea
              id="tr-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-brand-blue"
            />
          </div>

          <div>
            <label htmlFor="tr-email" className="block text-sm font-medium text-brand-ink">
              {t('emailLabel')}
            </label>
            <input
              id="tr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:border-brand-blue"
            />
          </div>

          {submitState === 'error' && submitErrorCode ? (
            <p role="alert" className="text-sm text-red-600">
              {submitErrorCode === 'rate_limited'
                ? t('errors.rate_limited')
                : submitErrorCode === 'not_configured'
                  ? t('errors.not_configured')
                  : submitErrorCode === 'missing_required' || submitErrorCode === 'missing_file'
                    ? t('errors.missing_required')
                    : submitErrorCode === 'too_large'
                      ? t('errors.too_large')
                      : submitErrorCode === 'invalid_pdf'
                        ? t('errors.invalid_pdf')
                        : submitErrorCode === 'unknown_document'
                          ? t('errors.unknown_document')
                          : submitErrorCode === 'not_published'
                            ? t('errors.not_published')
                            : submitErrorCode === 'unknown_language'
                              ? t('errors.unknown_language')
                              : submitErrorCode === 'upload_failed' ||
                                  submitErrorCode === 'save_failed' ||
                                  submitErrorCode === 'document_lookup_failed'
                                ? t('errors.server')
                                : submitErrorCode === 'read_failed'
                                  ? t('errors.read_failed')
                                  : t('errors.generic')}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                resetForClose();
                onClose();
              }}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit} isLoading={submitState === 'submitting'}>
              {submitState === 'submitting' ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
