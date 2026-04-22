/**
 * SuggestEditIcon — tiny pencil button placed next to any editable field
 * on a document or organization page. Clicking opens the SuggestEditModal
 * pre-filled with the field name and its current value.
 *
 * Why this is its own file:
 * - Every metadata row needs it, so we want one consistent styling.
 * - Keeping it decoupled from <SuggestEditModal> means the modal can lazy-
 *   mount only after the first click.
 */
'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SuggestEditModal from './SuggestEditModal';
import type { SuggestionTargetType } from '@/types/directus';

interface Props {
  targetType: SuggestionTargetType;
  targetId: string;
  fieldName: string;
  fieldLabel: string;
  currentValue: string;
}

export default function SuggestEditIcon({
  targetType,
  targetId,
  fieldName,
  fieldLabel,
  currentValue,
}: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('document');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('suggestEditAria', { field: fieldLabel })}
        className="ms-1 inline-flex h-5 w-5 items-center justify-center rounded text-brand-ink-soft opacity-60 transition-opacity hover:bg-brand-blue-soft hover:text-brand-blue hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
      >
        <Pencil size={12} aria-hidden="true" />
      </button>
      {open ? (
        <SuggestEditModal
          open
          onClose={() => setOpen(false)}
          targetType={targetType}
          targetId={targetId}
          fieldName={fieldName}
          fieldLabel={fieldLabel}
          currentValue={currentValue}
        />
      ) : null}
    </>
  );
}
