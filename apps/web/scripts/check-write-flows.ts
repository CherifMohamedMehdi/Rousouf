import assert from 'node:assert/strict';
import { createContactMessage } from '@/lib/directus/contactMessages';
import { createSuggestion } from '@/lib/directus/suggestions';
import { createTranslationSuggestion } from '@/lib/directus/translationSuggestions';
import { createSubmission } from '@/lib/directus/submissions';
import { defaultOpsSettingsFromEnv, getOpsSettings } from '@/lib/directus/opsSettings';

type FetchCall = {
  input: string;
  init?: RequestInit;
};

const originalFetch = global.fetch;
const originalDirectusUrl = process.env.DIRECTUS_URL;
const originalDirectusToken = process.env.DIRECTUS_TOKEN;
const originalNotifyToEmail = process.env.NOTIFY_TO_EMAIL;
const originalNotificationsEnabled = process.env.NOTIFICATIONS_ENABLED;
const originalNotifyContactEnabled = process.env.NOTIFY_CONTACT_ENABLED;
const originalNotifySuggestionsEnabled = process.env.NOTIFY_SUGGESTIONS_ENABLED;
const originalNotifySubmissionsEnabled = process.env.NOTIFY_SUBMISSIONS_ENABLED;
const originalBackupEnabled = process.env.BACKUP_ENABLED;
const originalBackupInterval = process.env.BACKUP_INTERVAL_HOURS;
const originalBackupRetention = process.env.BACKUP_RETENTION_DAYS;
const originalBackupS3Enabled = process.env.BACKUP_S3_ENABLED;
const originalBackupS3Prefix = process.env.BACKUP_S3_PREFIX;

async function run() {
  const calls: FetchCall[] = [];

  global.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ input: url, init });
    if (url.includes('/items/contact_messages')) {
      return new Response(
        JSON.stringify({ data: { id: 'cm-1', status: 'new', date_created: '2026-01-01T00:00:00.000Z' } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/items/suggestions')) {
      return new Response(
        JSON.stringify({ data: { id: 'sg-1', status: 'pending', date_submitted: '2026-01-01T00:00:00.000Z' } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/items/submissions')) {
      return new Response(
        JSON.stringify({ data: { id: 'sb-1', status: 'pending', date_submitted: '2026-01-01T00:00:00.000Z' } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/items/translation_suggestions')) {
      return new Response(
        JSON.stringify({
          data: { id: 'ts-1', status: 'pending', date_submitted: '2026-01-01T00:00:00.000Z' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/items/ops_settings')) {
      return new Response(
        JSON.stringify({
          data: {
            id: 1,
            notifications_enabled: true,
            notify_contact_enabled: true,
            notify_suggestions_enabled: false,
            notify_submissions_enabled: true,
            notify_to_emails: ['ops@example.org', 'mod@example.org'],
            backup_enabled: true,
            backup_interval_hours: 12,
            backup_retention_days_local: 45,
            backup_s3_enabled: true,
            backup_s3_prefix: 'prod',
            backup_pause_until: null,
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    return new Response(JSON.stringify({ data: {} }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  process.env.DIRECTUS_URL = 'http://localhost:8055';
  process.env.DIRECTUS_TOKEN = 'test-token';

  const contact = await createContactMessage({
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Hello',
    message: 'Test message',
  });
  assert.equal(contact.id, 'cm-1');
  assert.equal(contact.status, 'new');

  const suggestion = await createSuggestion({
    target_type: 'document',
    document_id: 'doc-1',
    field_name: 'title',
    field_label: 'Title',
    current_value: 'Old',
    suggested_value: 'New',
    note: 'please update',
    suggested_by_email: 'test@example.com',
  });
  assert.equal(suggestion.id, 'sg-1');
  assert.equal(suggestion.status, 'pending');

  const submission = await createSubmission({
    title: 'Submitted doc',
    author: 'Author',
    organization: null,
    date_published: null,
    abstract_original: 'abstract',
    abstract_translations: { en: 'abstract' },
    language: null,
    themes: [],
    document_type: null,
    governorates: [],
    keywords: ['x'],
    file_hash: 'abc',
    content_fingerprint: 'def',
    file_url: '',
    submitted_by_name: 'Researcher',
    submitted_by_email: 'r@example.com',
    submitted_by_org: '',
    batch_id: '',
  });
  assert.equal(submission.id, 'sb-1');
  assert.equal(submission.status, 'pending');

  const translationSuggestion = await createTranslationSuggestion({
    document: 'doc-1',
    language: 'lang-fr',
    pdf_file: 'file-uuid-1',
    file_hash: 'deadbeef',
    content_fingerprint: 'fingerprint',
    note: 'official translation',
    suggested_by_email: 'translator@example.com',
  });
  assert.equal(translationSuggestion.id, 'ts-1');
  assert.equal(translationSuggestion.status, 'pending');

  assert.equal(calls.some((c) => c.input.endsWith('/items/contact_messages')), true);
  assert.equal(calls.some((c) => c.input.endsWith('/items/suggestions')), true);
  assert.equal(calls.some((c) => c.input.endsWith('/items/submissions')), true);
  assert.equal(calls.some((c) => c.input.endsWith('/items/translation_suggestions')), true);

  process.env.NOTIFICATIONS_ENABLED = 'true';
  process.env.NOTIFY_CONTACT_ENABLED = 'true';
  process.env.NOTIFY_SUGGESTIONS_ENABLED = 'true';
  process.env.NOTIFY_SUBMISSIONS_ENABLED = 'false';
  process.env.NOTIFY_TO_EMAIL = 'fallback@example.org';
  process.env.BACKUP_ENABLED = 'false';
  process.env.BACKUP_INTERVAL_HOURS = '24';
  process.env.BACKUP_RETENTION_DAYS = '30';
  process.env.BACKUP_S3_ENABLED = 'false';
  process.env.BACKUP_S3_PREFIX = 'roufouf';
  const defaults = defaultOpsSettingsFromEnv();
  assert.equal(defaults.notifications_enabled, true);
  assert.equal(defaults.notify_submissions_enabled, false);
  assert.deepEqual(defaults.notify_to_emails, ['fallback@example.org']);

  const remoteSettings = await getOpsSettings();
  assert.equal(remoteSettings.backup_enabled, true);
  assert.equal(remoteSettings.backup_interval_hours, 12);
  assert.equal(remoteSettings.notify_suggestions_enabled, false);
  assert.deepEqual(remoteSettings.notify_to_emails, ['ops@example.org', 'mod@example.org']);

  // Mock-mode check: no DIRECTUS_URL means no outbound call.
  calls.length = 0;
  process.env.DIRECTUS_URL = '';
  await createContactMessage({
    name: 'Mock User',
    email: 'mock@example.com',
    message: 'msg',
  });
  assert.equal(calls.length, 0);
}

run()
  .then(() => {
    console.log('write-flow checks passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    global.fetch = originalFetch;
    process.env.DIRECTUS_URL = originalDirectusUrl;
    process.env.DIRECTUS_TOKEN = originalDirectusToken;
    process.env.NOTIFY_TO_EMAIL = originalNotifyToEmail;
    process.env.NOTIFICATIONS_ENABLED = originalNotificationsEnabled;
    process.env.NOTIFY_CONTACT_ENABLED = originalNotifyContactEnabled;
    process.env.NOTIFY_SUGGESTIONS_ENABLED = originalNotifySuggestionsEnabled;
    process.env.NOTIFY_SUBMISSIONS_ENABLED = originalNotifySubmissionsEnabled;
    process.env.BACKUP_ENABLED = originalBackupEnabled;
    process.env.BACKUP_INTERVAL_HOURS = originalBackupInterval;
    process.env.BACKUP_RETENTION_DAYS = originalBackupRetention;
    process.env.BACKUP_S3_ENABLED = originalBackupS3Enabled;
    process.env.BACKUP_S3_PREFIX = originalBackupS3Prefix;
  });

