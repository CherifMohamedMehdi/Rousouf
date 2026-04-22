/**
 * Directus client abstraction.
 *
 * In dev/mock mode (no DIRECTUS_URL set), the helpers in sibling files read
 * from mocks/*. When DIRECTUS_URL is set, every helper issues the equivalent
 * Directus REST call.
 *
 * Exporting from here keeps the swap to one change per helper — look for
 * `if (isMockMode())` branches in lib/directus/*.ts.
 */
import { createDirectus, rest, staticToken, type DirectusClient, type RestClient } from '@directus/sdk';

export function isMockMode(): boolean {
  return !process.env.DIRECTUS_URL;
}

let cached: (DirectusClient<never> & RestClient<never>) | null = null;

export function directus(): DirectusClient<never> & RestClient<never> {
  if (cached) return cached;
  const url = process.env.DIRECTUS_URL;
  if (!url) {
    throw new Error(
      'Directus client requested but DIRECTUS_URL is not set. Use isMockMode() to branch or set DIRECTUS_URL.',
    );
  }
  const token = process.env.DIRECTUS_TOKEN;
  const base = createDirectus<never>(url).with(rest());
  cached = (token ? base.with(staticToken(token)) : base) as DirectusClient<never> & RestClient<never>;
  return cached;
}
