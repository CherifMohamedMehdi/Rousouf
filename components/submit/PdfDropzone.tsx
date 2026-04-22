/**
 * PdfDropzone — drop area + file picker.
 *
 * Enforces the single/bulk cap, MIME filter (application/pdf), and
 * per-file byte cap. Emits File[] back up to the parent which owns the
 * actual processing pipeline.
 */
'use client';

import { useRef, type ChangeEvent, type DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  mode: 'single' | 'bulk';
  maxFiles: number;
  maxMb: number;
  onAccepted(files: File[]): void;
}

/**
 * Reads the first 4 bytes and confirms the `%PDF` magic number
 * (0x25 0x50 0x44 0x46). A client that lies about Content-Type or file
 * extension still can't sneak a non-PDF through this check. The server
 * re-verifies the hash at /api/submissions so this is defense-in-depth.
 */
async function hasPdfMagicBytes(file: File): Promise<boolean> {
  try {
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  } catch {
    return false;
  }
}

export default function PdfDropzone({ mode, maxFiles, maxMb, onAccepted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('submit');

  async function handleFiles(raw: FileList | File[]) {
    const max = mode === 'single' ? 1 : maxFiles;
    const maxBytes = maxMb * 1024 * 1024;
    const candidates = Array.from(raw)
      .filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      .filter((f) => f.size <= maxBytes)
      .slice(0, max);
    const verified = await Promise.all(candidates.map((f) => hasPdfMagicBytes(f)));
    const arr = candidates.filter((_, i) => verified[i]);
    if (arr.length) onAccepted(arr);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer?.files) void handleFiles(e.dataTransfer.files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) void handleFiles(e.target.files);
    e.target.value = '';
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-brand-paper-soft px-6 py-12 text-center transition-colors',
        'hover:border-brand-blue hover:bg-brand-blue-soft/40',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold',
      )}
    >
      <UploadCloud size={36} aria-hidden="true" className="text-brand-ink-soft" />
      <p className="mt-3 text-sm text-brand-ink">
        {mode === 'single' ? t('dropSingle') : t('dropBulk', { max: maxFiles })}
      </p>
      <p className="mt-1 text-xs text-brand-ink-soft">{t('fileMaxSize', { mb: maxMb })}</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple={mode === 'bulk'}
        onChange={onChange}
        className="sr-only"
      />
    </div>
  );
}
