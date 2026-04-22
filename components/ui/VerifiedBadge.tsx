/**
 * Trusted-organization badge.
 *
 * Rendered inline next to an organization name when `is_verified = true`.
 * Uses an aria-label (from translations) so screen readers announce the
 * meaning, not just a decorative checkmark.
 */
'use client';

import { useTranslations } from 'next-intl';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerifiedBadge({
  size = 14,
  className,
  showLabel = false,
}: {
  size?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const t = useTranslations('organization');
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-brand-teal', className)}
      aria-label={t('verifiedAria')}
      title={t('verifiedBadge')}
    >
      <BadgeCheck size={size} aria-hidden="true" />
      {showLabel ? <span className="text-xs font-medium">{t('verifiedBadge')}</span> : null}
    </span>
  );
}
