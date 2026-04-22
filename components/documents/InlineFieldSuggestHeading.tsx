/**
 * Visible field label + suggest-edit pencil (same pattern as MetadataRow dt).
 * Client-only because SuggestEditIcon owns modal state.
 */
'use client';

import SuggestEditIcon from '@/components/documents/SuggestEditIcon';
import type { SuggestionTargetType } from '@/types/directus';

interface Props {
  label: string;
  targetType: SuggestionTargetType;
  targetId: string;
  fieldName: string;
  fieldLabel: string;
  currentValue: string;
}

export default function InlineFieldSuggestHeading({
  label,
  targetType,
  targetId,
  fieldName,
  fieldLabel,
  currentValue,
}: Props) {
  return (
    <div className="mb-2 flex items-center text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
      <span>{label}</span>
      <SuggestEditIcon
        targetType={targetType}
        targetId={targetId}
        fieldName={fieldName}
        fieldLabel={fieldLabel}
        currentValue={currentValue}
      />
    </div>
  );
}
