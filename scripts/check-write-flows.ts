import assert from 'node:assert/strict';
import { createContactMessage } from '@/lib/directus/contactMessages';
import { createSuggestion } from '@/lib/directus/suggestions';
import { createSubmission } from '@/lib/directus/submissions';

type FetchCall = {
  input: string;
  init?: RequestInit;
};

const originalFetch = global.fetch;
const originalDirectusUrl = process.env.DIRECTUS_URL;
const originalDirectusToken = process.env.DIRECTUS_TOKEN;

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

  assert.equal(calls.some((c) => c.input.endsWith('/items/contact_messages')), true);
  assert.equal(calls.some((c) => c.input.endsWith('/items/suggestions')), true);
  assert.equal(calls.some((c) => c.input.endsWith('/items/submissions')), true);

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
  });

