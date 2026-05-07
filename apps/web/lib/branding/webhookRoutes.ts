/**
 * Shared helpers for /api/admin publish + revert branding webhooks (Directus).
 */
import { revalidatePath } from 'next/cache';

import type { BrandingSnapshot } from '@/types/directus';
import { parseDirectusFileField } from '@/lib/directus/catalog';

async function fetchOpsSettingsRowAdmin(): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${brandingDirectusBase()}/items/ops_settings?fields=${encodeURIComponent('branding_webhook_secret')}`,
    {
      headers: { authorization: `Bearer ${brandingAdminToken()}` },
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(`ops_settings read failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data?: Record<string, unknown> };
  if (!json.data) throw new Error('ops_settings singleton returned no data');
  return json.data;
}

/**
 * Shared secret for branding webhooks.
 * Prefer **Ops Settings → Branding webhook secret** in Directus; env
 * `BRANDING_WEBHOOK_SECRET` overrides when set (e.g. CI).
 */
export async function resolveBrandingWebhookSecret(): Promise<string | null> {
  const envSecret = process.env.BRANDING_WEBHOOK_SECRET?.trim();
  if (envSecret) return envSecret;
  try {
    const row = await fetchOpsSettingsRowAdmin();
    const s = row.branding_webhook_secret;
    return typeof s === 'string' && s.trim() ? s.trim() : null;
  } catch {
    return null;
  }
}

export async function isBrandingWebhookAuthorized(req: Request): Promise<boolean> {
  const secret = await resolveBrandingWebhookSecret();
  if (!secret) return false;
  const header = req.headers.get('x-branding-secret');
  const bearer = req.headers.get('authorization');
  if (header === secret) return true;
  if (bearer === `Bearer ${secret}`) return true;
  return false;
}

export function brandingDirectusBase(): string {
  const base = process.env.DIRECTUS_URL;
  if (!base) throw new Error('DIRECTUS_URL is not set');
  return base.replace(/\/$/, '');
}

export function brandingAdminToken(): string {
  const token = process.env.DIRECTUS_ADMIN_TOKEN;
  if (!token) throw new Error('DIRECTUS_ADMIN_TOKEN is not set');
  return token;
}

export async function fetchBrandingSettingsRow(): Promise<Record<string, unknown>> {
  const res = await fetch(`${brandingDirectusBase()}/items/branding_settings`, {
    headers: { authorization: `Bearer ${brandingAdminToken()}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`branding_settings read failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data?: Record<string, unknown> };
  if (!json.data) throw new Error('branding_settings singleton returned no data');
  return json.data;
}

export async function patchBrandingSettings(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${brandingDirectusBase()}/items/branding_settings`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${brandingAdminToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`branding_settings patch failed: ${res.status} ${await res.text()}`);
}

export function revalidateBrandingLayouts(): void {
  revalidatePath('/', 'layout');
  for (const loc of ['ar', 'fr', 'en']) {
    revalidatePath(`/${loc}`, 'layout');
  }
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/u.test(value.trim());
}

function pickColor(value: unknown, fallback: string): string {
  return isHexColor(value) ? value.trim() : fallback;
}

const DEFAULT_HEX = {
  primary: '#1B3F6E',
  secondary: '#C9952A',
  background: '#F7F5F0',
  text: '#1A1A1A',
  border: '#E4E0D6',
} as const;

function snapshotFromPublishedFields(row: Record<string, unknown>): BrandingSnapshot {
  return {
    logo: parseDirectusFileField(row.published_logo) ?? undefined,
    primary_color: pickColor(row.published_primary_color, DEFAULT_HEX.primary),
    secondary_color: pickColor(row.published_secondary_color, DEFAULT_HEX.secondary),
    background_color: pickColor(row.published_background_color, DEFAULT_HEX.background),
    text_color: pickColor(row.published_text_color, DEFAULT_HEX.text),
    border_color: pickColor(row.published_border_color, DEFAULT_HEX.border),
  };
}

function snapshotFromDraftFields(row: Record<string, unknown>): BrandingSnapshot {
  return {
    logo: parseDirectusFileField(row.logo) ?? undefined,
    primary_color: pickColor(row.primary_color, DEFAULT_HEX.primary),
    secondary_color: pickColor(row.secondary_color, DEFAULT_HEX.secondary),
    background_color: pickColor(row.background_color, DEFAULT_HEX.background),
    text_color: pickColor(row.text_color, DEFAULT_HEX.text),
    border_color: pickColor(row.border_color, DEFAULT_HEX.border),
  };
}

function snapshotFromStoredJson(raw: unknown): BrandingSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  return {
    logo: parseDirectusFileField(s.logo) ?? undefined,
    primary_color: pickColor(s.primary_color, DEFAULT_HEX.primary),
    secondary_color: pickColor(s.secondary_color, DEFAULT_HEX.secondary),
    background_color: pickColor(s.background_color, DEFAULT_HEX.background),
    text_color: pickColor(s.text_color, DEFAULT_HEX.text),
    border_color: pickColor(s.border_color, DEFAULT_HEX.border),
  };
}

export function readPublishedSnapshot(row: Record<string, unknown>): BrandingSnapshot {
  return snapshotFromPublishedFields(row);
}

export function readDraftSnapshot(row: Record<string, unknown>): BrandingSnapshot {
  return snapshotFromDraftFields(row);
}

export function readStoredPreviousSnapshot(row: Record<string, unknown>): BrandingSnapshot | null {
  return snapshotFromStoredJson(row.previous_published_snapshot);
}

/** Payload fields Directus expects for *published* columns from a BrandingSnapshot. */
export function publishedFieldsFromSnapshot(s: BrandingSnapshot): Record<string, unknown> {
  return {
    published_logo: s.logo ?? null,
    published_primary_color: s.primary_color,
    published_secondary_color: s.secondary_color,
    published_background_color: s.background_color,
    published_text_color: s.text_color,
    published_border_color: s.border_color,
  };
}
