/**
 * Loads the privacy-respecting analytics snippet if it's configured.
 * Renders nothing when NEXT_PUBLIC_ANALYTICS_DOMAIN / _SRC aren't set.
 */
import Script from 'next/script';
import { analyticsEnabled } from '@/lib/analytics';

export default function Analytics() {
  if (!analyticsEnabled()) return null;
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN!;
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC!;
  return (
    <Script
      src={src}
      data-domain={domain}
      strategy="afterInteractive"
      defer
    />
  );
}
