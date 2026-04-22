/**
 * Roufouf wordmark + symbol.
 *
 * Design: the letter "ر" (Ra, first letter of رفوف) standing on a pair of
 * stylized shelves. Renders inline so it scales cleanly and inherits the
 * current text color via `currentColor`.
 *
 * `variant="mark"` is the icon only (for favicons, tight headers).
 * `variant="full"` adds the wordmark.
 */
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'mark' | 'full';
  className?: string;
  size?: number;
  title?: string;
}

export default function Logo({ variant = 'full', className, size = 36, title = 'Roufouf' }: LogoProps) {
  const locale = useLocale();
  const isArabic = locale === 'ar';
  return (
    <span
      className={cn('inline-flex items-center gap-3 text-brand-blue', className)}
      aria-label={title}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <rect x="4" y="30" width="40" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
        <rect x="4" y="38" width="40" height="3" rx="1.5" fill="currentColor" opacity="0.15" />
        <path
          d="M12 10C12 10 16 10 20 10C30 10 34 16 34 22C34 28 30 31 26 31H18"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="34" cy="22" r="1.8" fill="#C9952A" />
      </svg>
      {variant === 'full' ? (
        <span
          className={cn('flex flex-col leading-none')}
        >
          <span
            className={cn(
              'text-lg font-semibold tracking-tight text-brand-blue',
              isArabic && 'font-arabic text-xl',
            )}
          >
            {isArabic ? 'رفوف' : 'Roufouf'}
          </span>
        </span>
      ) : null}
    </span>
  );
}
