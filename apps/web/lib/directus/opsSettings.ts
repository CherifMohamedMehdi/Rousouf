import { isMockMode } from './client';
import { directusGetSingleton } from './http';
import type { PublicPdfSource } from '@/types/directus';

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function envNumber(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function envEmails(name: string): string[] {
  const raw = process.env[name] ?? '';
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export type OpsSettings = {
  public_pdf_source: PublicPdfSource;
  notifications_enabled: boolean;
  notify_contact_enabled: boolean;
  notify_suggestions_enabled: boolean;
  notify_submissions_enabled: boolean;
  notify_to_emails: string[];
  backup_enabled: boolean;
  backup_interval_hours: number;
  backup_retention_days_local: number;
  backup_s3_enabled: boolean;
  backup_s3_prefix: string;
  backup_pause_until?: string | null;
};

export function defaultOpsSettingsFromEnv(): OpsSettings {
  return {
    public_pdf_source: parsePublicPdfSource(process.env.PUBLIC_PDF_SOURCE),
    notifications_enabled: envFlag('NOTIFICATIONS_ENABLED', false),
    notify_contact_enabled: envFlag('NOTIFY_CONTACT_ENABLED', true),
    notify_suggestions_enabled: envFlag('NOTIFY_SUGGESTIONS_ENABLED', true),
    notify_submissions_enabled: envFlag('NOTIFY_SUBMISSIONS_ENABLED', true),
    notify_to_emails: envEmails('NOTIFY_TO_EMAIL'),
    backup_enabled: envFlag('BACKUP_ENABLED', false),
    backup_interval_hours: envNumber('BACKUP_INTERVAL_HOURS', 24),
    backup_retention_days_local: envNumber('BACKUP_RETENTION_DAYS', 30),
    backup_s3_enabled: envFlag('BACKUP_S3_ENABLED', false),
    backup_s3_prefix: process.env.BACKUP_S3_PREFIX ?? 'roufouf',
    backup_pause_until: null,
  };
}

function parsePublicPdfSource(value: unknown): PublicPdfSource {
  return value === 'zenodo' || value === 'directus' ? value : 'directus';
}

function parseEmails(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

let inFlightSettings: Promise<OpsSettings> | null = null;

/** Public / site-token reads must not pull server-only webhook secrets. */
const OPS_SETTINGS_PUBLIC_FIELDS = [
  'public_pdf_source',
  'notifications_enabled',
  'notify_contact_enabled',
  'notify_suggestions_enabled',
  'notify_submissions_enabled',
  'notify_to_emails',
  'backup_enabled',
  'backup_interval_hours',
  'backup_retention_days_local',
  'backup_s3_enabled',
  'backup_s3_prefix',
  'backup_pause_until',
].join(',');

async function fetchOpsSettings(): Promise<OpsSettings> {
  const fallback = defaultOpsSettingsFromEnv();
  if (isMockMode()) return fallback;
  try {
    const row = await fetchOpsSettingsRow(OPS_SETTINGS_PUBLIC_FIELDS);
    if (!row) return fallback;
    return {
      public_pdf_source: parsePublicPdfSource(row.public_pdf_source ?? fallback.public_pdf_source),
      notifications_enabled: typeof row.notifications_enabled === 'boolean' ? row.notifications_enabled : fallback.notifications_enabled,
      notify_contact_enabled:
        typeof row.notify_contact_enabled === 'boolean' ? row.notify_contact_enabled : fallback.notify_contact_enabled,
      notify_suggestions_enabled:
        typeof row.notify_suggestions_enabled === 'boolean' ? row.notify_suggestions_enabled : fallback.notify_suggestions_enabled,
      notify_submissions_enabled:
        typeof row.notify_submissions_enabled === 'boolean' ? row.notify_submissions_enabled : fallback.notify_submissions_enabled,
      notify_to_emails: parseEmails(row.notify_to_emails).length ? parseEmails(row.notify_to_emails) : fallback.notify_to_emails,
      backup_enabled: typeof row.backup_enabled === 'boolean' ? row.backup_enabled : fallback.backup_enabled,
      backup_interval_hours:
        typeof row.backup_interval_hours === 'number' && row.backup_interval_hours > 0
          ? row.backup_interval_hours
          : fallback.backup_interval_hours,
      backup_retention_days_local:
        typeof row.backup_retention_days_local === 'number' && row.backup_retention_days_local > 0
          ? row.backup_retention_days_local
          : fallback.backup_retention_days_local,
      backup_s3_enabled: typeof row.backup_s3_enabled === 'boolean' ? row.backup_s3_enabled : fallback.backup_s3_enabled,
      backup_s3_prefix: typeof row.backup_s3_prefix === 'string' && row.backup_s3_prefix.trim() ? row.backup_s3_prefix : fallback.backup_s3_prefix,
      backup_pause_until: typeof row.backup_pause_until === 'string' ? row.backup_pause_until : null,
    };
  } catch {
    return fallback;
  }
}

async function fetchOpsSettingsRow(fields: string): Promise<Record<string, unknown> | null> {
  const base = process.env.DIRECTUS_URL?.replace(/\/$/, '');
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;
  if (base && adminToken) {
    const res = await fetch(`${base}/items/ops_settings?fields=${encodeURIComponent(fields)}`, {
      headers: { authorization: `Bearer ${adminToken}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: Record<string, unknown> };
      return json.data ?? null;
    }
  }
  return directusGetSingleton<Record<string, unknown>>('ops_settings', { fields });
}

export async function getOpsSettings(): Promise<OpsSettings> {
  if (!inFlightSettings) {
    inFlightSettings = fetchOpsSettings().finally(() => {
      inFlightSettings = null;
    });
  }
  return inFlightSettings;
}
