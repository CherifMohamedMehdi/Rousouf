/**
 * Tag — a larger, subtler label than <Badge>. Often links somewhere.
 */
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Tag({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const base =
    'inline-flex items-center rounded-md border border-border bg-white px-2 py-0.5 text-xs font-medium text-brand-ink-soft hover:border-brand-blue hover:text-brand-blue transition-colors';
  if (href) {
    return (
      <Link href={href} className={cn(base, className)}>
        {children}
      </Link>
    );
  }
  return <span className={cn(base, className)}>{children}</span>;
}
