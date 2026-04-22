/**
 * CitationBlock — tabbed academic citation generator.
 *
 * Formats: APA / Chicago / MLA / BibTeX / RIS.
 *
 * When the document is missing citation-relevant fields (author, date,
 * organization, title), a visible warning lists which fields are missing
 * and links to the matching <SuggestEditIcon> placeholders, so readers can
 * fix the record rather than be stuck with an incomplete citation.
 *
 * Copy-to-clipboard uses the modern async Clipboard API with a plain-text
 * fallback for BibTeX/RIS so readers can paste into Zotero, EndNote, etc.
 */
'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Copy, Check, Download, AlertCircle } from 'lucide-react';
import {
  formatApa,
  formatBibtex,
  formatChicago,
  formatMla,
  formatRis,
  getCitationMissingFields,
  type CitationFormat,
} from '@/lib/citations';
import type { Document } from '@/types/directus';
import { cn } from '@/lib/utils';

const TABS: CitationFormat[] = ['apa', 'chicago', 'mla', 'bibtex', 'ris'];

const DOWNLOADABLE: Partial<Record<CitationFormat, { ext: string; mime: string }>> = {
  bibtex: { ext: 'bib', mime: 'application/x-bibtex' },
  ris: { ext: 'ris', mime: 'application/x-research-info-systems' },
};

function renderCitation(format: CitationFormat, doc: Document): string {
  switch (format) {
    case 'apa':
      return formatApa(doc);
    case 'chicago':
      return formatChicago(doc);
    case 'mla':
      return formatMla(doc);
    case 'bibtex':
      return formatBibtex(doc);
    case 'ris':
      return formatRis(doc);
  }
}

export default function CitationBlock({ document: doc }: { document: Document }) {
  const locale = useLocale() as 'ar' | 'fr' | 'en';
  const t = useTranslations('document.citation');
  const [active, setActive] = useState<CitationFormat>('apa');
  const [copied, setCopied] = useState(false);

  const missing = useMemo(() => getCitationMissingFields(doc), [doc]);
  const text = useMemo(() => renderCitation(active, doc), [active, doc]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // best-effort fallback handled silently
    }
  }

  function onDownload() {
    const dl = DOWNLOADABLE[active];
    if (!dl) return;
    const blob = new Blob([text], { type: dl.mime });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `roufouf-${doc.id}.${dl.ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="citation-heading" className="rounded-xl border border-border bg-white p-5">
      <h2 id="citation-heading" className="text-lg font-semibold text-brand-blue">
        {t('heading')}
      </h2>

      <div className="mt-3 flex flex-wrap gap-1 border-b border-border" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={tab === active}
            onClick={() => setActive(tab)}
            className={cn(
              'rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === active
                ? 'bg-brand-blue-soft text-brand-blue'
                : 'text-brand-ink-soft hover:text-brand-blue',
            )}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {missing.length > 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p>
            {t('missingWarning')}
            {missing.map((m, i) => (
              <span key={m.key}>
                {i > 0 ? ', ' : ''}
                <span className="font-medium">{t('missingField', { field: m.label[locale] })}</span>
              </span>
            ))}
            .
          </p>
        </div>
      ) : null}

      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-brand-paper-soft p-4 text-sm text-brand-ink">
        {text}
      </pre>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-brand-ink hover:border-brand-blue hover:text-brand-blue"
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? t('copied') : t('copy')}
        </button>
        {DOWNLOADABLE[active] ? (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-brand-ink hover:border-brand-blue hover:text-brand-blue"
          >
            <Download size={14} aria-hidden="true" />
            {t('download')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
