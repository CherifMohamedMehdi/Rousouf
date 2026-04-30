'use client';

import { Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Props {
  total: number;
  confirmThreshold?: number;
}

export default function ExportButton({ total, confirmThreshold = 1000 }: Props) {
  const t = useTranslations('search.export');
  const params = useSearchParams();

  function onExport() {
    if (total >= confirmThreshold) {
      const confirmed = window.confirm(
        t('confirmLarge', { count: total, threshold: confirmThreshold }),
      );
      if (!confirmed) return;
    }

    const next = new URLSearchParams(params.toString());
    next.delete('page');
    next.delete('limit');
    const query = next.toString();
    const url = `/api/documents/export${query ? `?${query}` : ''}`;
    window.location.assign(url);
  }

  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex h-9 items-center gap-2 rounded border border-border bg-white px-3 text-sm text-brand-ink-soft hover:border-brand-blue hover:text-brand-blue"
    >
      <Download size={14} />
      <span>{t('button')}</span>
    </button>
  );
}

