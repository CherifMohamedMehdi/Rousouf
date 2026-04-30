/**
 * SubmitForm — the orchestrator for the Submit page.
 *
 * Responsibilities:
 *  - Owns the list of SubmitItems and advances each one through its
 *    lifecycle: extract → hash → fingerprint → duplicate-check → ready.
 *  - Renders the mode toggle (Single | Bulk).
 *  - Collects submitter identity (name / email / organization) and
 *    attaches them to every item when submitting, sharing one `batch_id`
 *    across the whole bulk upload for easy editorial triage.
 *
 * Note: PDF.js is imported via dynamic import() so it is only fetched on
 * the client, and only when a file is actually dropped.
 */
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import PdfDropzone from './PdfDropzone';
import SubmitItemEditor from './SubmitItemEditor';
import { emptyMetadata, type SubmitItem, type SubmitItemMetadata } from './types';
import type { DocumentType, Governorate, Language, Organization, Theme } from '@/types/directus';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

const MAX_BULK = Number(process.env.NEXT_PUBLIC_MAX_BULK_FILES) || 20;
const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 50;

interface Props {
  themes: Theme[];
  documentTypes: DocumentType[];
  governorates: Governorate[];
  languages: Language[];
  organizations: Organization[];
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SubmitForm(props: Props) {
  const t = useTranslations('submit');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [items, setItems] = useState<SubmitItem[]>([]);
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitterOrg, setSubmitterOrg] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [allSubmitted, setAllSubmitted] = useState(false);

  const batchId = useMemo(() => (mode === 'bulk' ? uid() : undefined), [mode]);

  function patch(id: string, updater: (item: SubmitItem) => SubmitItem) {
    setItems((prev) => prev.map((it) => (it.id === id ? updater(it) : it)));
  }

  async function processFile(item: SubmitItem) {
    try {
      patch(item.id, (it) => ({ ...it, state: 'extracting' }));
      const { extractPdfText } = await import('@/lib/pdf/extract');
      const { detectMetadata } = await import('@/lib/pdf/detect');
      const extract = await extractPdfText(item.file);

      patch(item.id, (it) => ({ ...it, state: 'hashing', extractedText: extract.text }));
      const { sha256File } = await import('@/lib/pdf/hash');
      const { buildFingerprint } = await import('@/lib/pdf/fingerprint');
      const hash = await sha256File(item.file);
      const fingerprint = buildFingerprint(extract.text);

      const detected = detectMetadata(extract.text);
      const autoMeta: Partial<SubmitItemMetadata> = {
        title: detected.title ?? item.file.name.replace(/\.pdf$/i, ''),
        language: detected.language === 'other' ? '' : detected.language,
        date_published: detected.year ? `${detected.year}-01-01` : '',
        abstract: extract.text.slice(0, 800),
        auto: {
          title: Boolean(detected.title),
          language: detected.language !== 'other',
          year: Boolean(detected.year),
        },
      };

      patch(item.id, (it) => ({
        ...it,
        state: 'checking_duplicates',
        file_hash: hash,
        content_fingerprint: fingerprint,
        metadata: { ...it.metadata, ...autoMeta, auto: { ...it.metadata.auto, ...autoMeta.auto } } as SubmitItemMetadata,
      }));

      const res = await fetch('/api/duplicate-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file_hash: hash, content_fingerprint: fingerprint }),
      });
      const dup = res.ok ? await res.json() : undefined;

      patch(item.id, (it) => ({
        ...it,
        duplicateCheck: dup,
        state: dup?.exact
          ? 'duplicate_exact'
          : dup?.fuzzy?.length
            ? 'duplicate_fuzzy_pending'
            : 'ready',
      }));
    } catch (err) {
      patch(item.id, (it) => ({
        ...it,
        state: 'error',
        error: err instanceof Error ? err.message : 'processing_failed',
      }));
    }
  }

  async function onAccepted(files: File[]) {
    const next: SubmitItem[] = files.map((file) => ({
      id: uid(),
      file,
      state: 'queued',
      extractedText: '',
      file_hash: '',
      content_fingerprint: '',
      metadata: emptyMetadata(),
      confirmedNotDuplicate: false,
    }));
    setItems(mode === 'single' ? next.slice(0, 1) : [...items, ...next].slice(0, MAX_BULK));
    // Strictly sequential: scanned PDFs can stall the main thread if we
    // extract + hash + dedup-check multiple files in parallel. Processing
    // one at a time also makes the visible progress UI truthful.
    for (const it of next) {
      await processFile(it);
    }
  }

  function onMetadataChange(id: string, patchM: Partial<SubmitItemMetadata>) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, metadata: { ...it.metadata, ...patchM, auto: patchM.auto ?? it.metadata.auto } }
          : it,
      ),
    );
  }

  function onConfirmNotDuplicate(id: string) {
    patch(id, (it) => ({ ...it, confirmedNotDuplicate: true, state: 'ready' }));
  }

  function onRemove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const canSubmit = items.length > 0 && items.every((it) => it.state === 'ready' || it.state === 'submitted');

  async function submitAll() {
    for (const it of items) {
      if (it.state !== 'ready') continue;
      patch(it.id, (x) => ({ ...x, state: 'submitting' }));
      try {
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: it.metadata.title,
            author: it.metadata.author || undefined,
            organization: it.metadata.organization || undefined,
            date_published: it.metadata.date_published || undefined,
            abstract_original: it.metadata.abstract || undefined,
            language: it.metadata.language || undefined,
            document_type: it.metadata.document_type || undefined,
            themes: it.metadata.themes,
            governorates: it.metadata.governorates,
            keywords: it.metadata.keywords.split(',').map((s) => s.trim()).filter(Boolean),
            source_url: it.metadata.source_url.trim() || undefined,
            file_hash: it.file_hash,
            content_fingerprint: it.content_fingerprint,
            submitted_by_name: submitterName || undefined,
            submitted_by_email: submitterEmail || undefined,
            submitted_by_org: submitterOrg || undefined,
            batch_id: batchId,
            [HONEYPOT_FIELD]: honeypot,
          }),
        });
        if (!res.ok) throw new Error('submit_failed');
        patch(it.id, (x) => ({ ...x, state: 'submitted' }));
      } catch (e) {
        patch(it.id, (x) => ({
          ...x,
          state: 'error',
          error: e instanceof Error ? e.message : 'submit_failed',
        }));
      }
    }
    setAllSubmitted(items.every((it) => it.state === 'submitted' || it.state === 'submitting'));
  }

  if (allSubmitted && items.every((it) => it.state === 'submitted')) {
    return (
      <div className="rounded-xl border border-brand-teal/30 bg-brand-teal-soft p-8 text-center">
        <h2 className="text-xl font-semibold text-brand-blue">{t('success.title')}</h2>
        <p className="mt-2 text-sm text-brand-ink-soft">{t('success.body')}</p>
      </div>
    );
  }

  const doneCount = items.filter((it) => it.state === 'ready' || it.state === 'submitted').length;
  const warningCount = items.filter((it) =>
    ['duplicate_exact', 'duplicate_fuzzy_pending', 'error'].includes(it.state),
  ).length;

  return (
    <div className="space-y-6">
      <div role="tablist" className="inline-flex rounded-lg border border-border bg-white p-1">
        <button
          role="tab"
          aria-selected={mode === 'single'}
          onClick={() => setMode('single')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'single' ? 'bg-brand-blue text-white' : 'text-brand-ink-soft'}`}
        >
          {t('modeSingle')}
        </button>
        <button
          role="tab"
          aria-selected={mode === 'bulk'}
          onClick={() => setMode('bulk')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'bulk' ? 'bg-brand-blue text-white' : 'text-brand-ink-soft'}`}
        >
          {t('modeBulk', { max: MAX_BULK })}
        </button>
      </div>

      <PdfDropzone mode={mode} maxFiles={MAX_BULK} maxMb={MAX_MB} onAccepted={onAccepted} />

      {items.length > 0 ? (
        <>
          <p className="text-sm text-brand-ink-soft">
            {t('progress', { done: doneCount, total: items.length })}
            {' · '}
            {t('summary', { ready: doneCount, warning: warningCount })}
          </p>

          <div className="space-y-4">
            {items.map((it) => (
              <SubmitItemEditor
                key={it.id}
                item={it}
                themes={props.themes}
                documentTypes={props.documentTypes}
                governorates={props.governorates}
                languages={props.languages}
                organizations={props.organizations}
                onChange={onMetadataChange}
                onConfirmNotDuplicate={onConfirmNotDuplicate}
                onRemove={onRemove}
              />
            ))}
          </div>

          <section className="rounded-xl border border-border bg-white p-5">
            <h3 className="text-sm font-semibold text-brand-blue">About you</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <input
                placeholder={t('fields.submittedByName')}
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
              />
              <input
                type="email"
                placeholder={t('fields.submittedByEmail')}
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
              />
              <input
                placeholder={t('fields.submittedByOrg')}
                value={submitterOrg}
                onChange={(e) => setSubmitterOrg(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:border-brand-blue"
              />
            </div>
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
          </section>

          <div className="flex justify-end">
            <Button size="lg" disabled={!canSubmit} onClick={submitAll}>
              {mode === 'single' ? t('submit') : t('submitAll')}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
