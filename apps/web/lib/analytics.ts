/**
 * Privacy-respecting analytics hook.
 *
 * No-ops unless NEXT_PUBLIC_ANALYTICS_DOMAIN and NEXT_PUBLIC_ANALYTICS_SRC
 * are both set. When set, the <Analytics> component renders a `<script>`
 * tag (Plausible / Umami / Cabin all compatible).
 *
 * Custom events: call `track(name, props)` for downloads, search-with-zero-
 * results, etc. Event names stay stable; new events can be added without
 * touching the provider.
 */

export function analyticsEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN && process.env.NEXT_PUBLIC_ANALYTICS_SRC,
  );
}

export interface TrackProps {
  [key: string]: string | number | boolean | undefined;
}

export function track(name: string, props?: TrackProps): void {
  if (typeof window === 'undefined') return;
  const plausible = (window as unknown as { plausible?: (n: string, o?: { props: TrackProps }) => void }).plausible;
  if (typeof plausible === 'function') {
    plausible(name, props ? { props } : undefined);
  }
}
