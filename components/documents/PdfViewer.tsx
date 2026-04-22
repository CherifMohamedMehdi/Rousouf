/**
 * PdfViewer — embeds a PDF with a conservative fallback.
 *
 * Rendering strategy:
 *  1. On wide viewports we use a native <iframe> with the file URL, which
 *     lets the browser's built-in viewer (Chrome, Firefox, Safari) handle
 *     paging / zoom / selection — no PDF.js bundle shipped to the client.
 *  2. On narrow viewports we show a thumbnail + "Open PDF" button instead
 *     so we don't stick users on mobile with a tiny unusable frame.
 *
 * If the file fails to load at all, the caller shows a plain download
 * link — the PDF is always downloadable above this block.
 */
'use client';

import { useTranslations } from 'next-intl';
import { FileText, ExternalLink } from 'lucide-react';

interface Props {
  fileUrl: string;
  filename?: string;
  title: string;
}

export default function PdfViewer({ fileUrl, filename, title }: Props) {
  const t = useTranslations('document');

  return (
    <figure aria-label={title} className="overflow-hidden rounded-xl border border-border bg-brand-paper-soft">
      <div className="hidden md:block">
        <iframe
          src={`${fileUrl}#view=FitH`}
          title={title}
          className="h-[70vh] w-full border-0 bg-white"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col items-center gap-3 p-8 text-center md:hidden">
        <FileText size={42} aria-hidden="true" className="text-brand-ink-soft" />
        <p className="text-sm text-brand-ink-soft">{filename ?? t('mainFile')}</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark"
        >
          {t('openInViewer')}
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </figure>
  );
}
