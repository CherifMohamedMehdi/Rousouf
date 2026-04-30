/**
 * Small label pill. Used for language badges, status chips, and metadata.
 */
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'blue' | 'gold' | 'teal' | 'soft';

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  blue: 'bg-brand-blue-soft text-brand-blue',
  gold: 'bg-brand-gold-soft text-brand-gold-dark',
  teal: 'bg-brand-teal-soft text-brand-teal',
  soft: 'bg-white border border-border text-foreground',
};

export default function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
