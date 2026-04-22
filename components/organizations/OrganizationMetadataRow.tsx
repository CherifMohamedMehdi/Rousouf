/**
 * Organization variant of <MetadataRow> — identical layout but wires the
 * inline SuggestEditIcon to target_type='organization'.
 */
import type { ReactNode } from 'react';
import SuggestEditIcon from '@/components/documents/SuggestEditIcon';

interface Props {
  label: string;
  children: ReactNode;
  orgId: string;
  fieldName: string;
  currentValue: string;
}

export default function OrganizationMetadataRow({
  label,
  children,
  orgId,
  fieldName,
  currentValue,
}: Props) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <dt className="mb-1 flex items-center text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
        <span>{label}</span>
        <SuggestEditIcon
          targetType="organization"
          targetId={orgId}
          fieldName={fieldName}
          fieldLabel={label}
          currentValue={currentValue}
        />
      </dt>
      <dd className="text-sm text-brand-ink">{children || '—'}</dd>
    </div>
  );
}
