'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import SuggestTranslationModal, { type TranslationLanguageOption } from './SuggestTranslationModal';

interface Props {
  documentId: string;
  documentLanguageId: string | null;
  languages: TranslationLanguageOption[];
}

export default function SuggestTranslationButton({ documentId, documentLanguageId, languages }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('document');

  const choices = documentLanguageId ? languages.filter((l) => l.id !== documentLanguageId) : languages;
  if (choices.length === 0) return null;

  return (
    <>
      <Button type="button" variant="ghost" className="h-auto gap-1.5 px-2 py-1 text-sm" onClick={() => setOpen(true)}>
        <Languages size={16} aria-hidden="true" className="text-brand-blue" />
        {t('suggestTranslation')}
      </Button>
      {open ? (
        <SuggestTranslationModal
          open
          onClose={() => setOpen(false)}
          documentId={documentId}
          documentLanguageId={documentLanguageId}
          languages={languages}
        />
      ) : null}
    </>
  );
}
