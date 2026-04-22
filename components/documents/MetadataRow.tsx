/**
 * MetadataRow — a single "label : value (edit)" line on the document detail
 * sidebar. Values can be plain strings, tag links, or arbitrary nodes. The
 * inline <SuggestEditIcon> is rendered next to the label so every field is
 * correctable without cluttering the value itself.
 */
import type { ReactNode } from 'react';
import SuggestEditIcon from './SuggestEditIcon';
import type { SuggestionTargetType } from '@/types/directus';

interface Props {
  label: string;
  children: ReactNode;
  targetType: SuggestionTargetType;
  targetId: string;
  fieldName: string;
  currentValue: string;
  missingHint?: boolean;
}

export default function MetadataRow({
  label,
  children,
  targetType,
  targetId,
  fieldName,
  currentValue,
  missingHint,
}: Props) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <dt className="mb-1 flex items-center text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
        <span>{label}</span>
        <SuggestEditIcon
          targetType={targetType}
          targetId={targetId}
          fieldName={fieldName}
          fieldLabel={label}
          currentValue={currentValue}
        />
      </dt>
      <dd className={`text-sm ${missingHint ? 'italic text-brand-ink-soft' : 'text-brand-ink'}`}>
        {children}
      </dd>
    </div>
  );
}
