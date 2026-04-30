/**
 * Pagination — numeric pager bound to the `page` query parameter.
 *
 * Renders links (so pages are shareable + crawlable) and disables itself
 * on the first / last page. Shows up to 7 numeric buttons with ellipses.
 */
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildQueryString } from '@/lib/search/urlParams';

interface Props {
  page: number;
  totalPages: number;
}

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

function pages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return range(1, total);
  if (current <= 4) return [...range(1, 5), 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', ...range(total - 4, total)];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

export default function Pagination({ page, totalPages }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (totalPages <= 1) return null;

  function hrefFor(p: number): string {
    const qs = buildQueryString(params, { page: p === 1 ? undefined : String(p) });
    return `${pathname}${qs ? `?${qs}` : ''}`;
  }

  const items = pages(page, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`inline-flex h-9 w-9 items-center justify-center rounded border border-border ${
          page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-brand-blue hover:text-brand-blue'
        }`}
      >
        <ChevronLeft size={16} aria-hidden="true" className="rtl:-scale-x-100" />
        <span className="sr-only">Previous</span>
      </Link>

      {items.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="px-1 text-sm text-brand-ink-soft">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded px-3 text-sm ${
              p === page
                ? 'bg-brand-blue text-white'
                : 'border border-border hover:border-brand-blue hover:text-brand-blue'
            }`}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`inline-flex h-9 w-9 items-center justify-center rounded border border-border ${
          page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-brand-blue hover:text-brand-blue'
        }`}
      >
        <ChevronRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
        <span className="sr-only">Next</span>
      </Link>
    </nav>
  );
}
