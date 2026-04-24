/**
 * POST /api/submissions
 *
 * Accepts a user-contributed document (JSON body, no file upload — the
 * file is sent separately to Directus via a signed URL in production; in
 * mock mode we just ignore it).
 *
 * Protections: honeypot, rate limiting, size caps on free-text fields.
 *
 * The client is responsible for:
 *  - Computing file_hash (SHA-256) and content_fingerprint client-side.
 *  - Calling /api/duplicate-check first and confirming "not a duplicate".
 *
 * Returns `{ id, status: 'pending' }` on success — editors will publish
 * from Directus.
 */
import { NextResponse } from 'next/server';
import { createSubmission } from '@/lib/directus/submissions';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { failsHoneypot, HONEYPOT_FIELD } from '@/lib/honeypot';
import type { LocalizedText } from '@/types/directus';
import { sendNotification } from '@/lib/notifications';

interface Body {
  title: string;
  author?: string;
  organization?: string;
  date_published?: string;
  abstract_original?: string;
  abstract_translations?: LocalizedText;
  language?: string;
  themes?: string[];
  document_type?: string;
  governorates?: string[];
  keywords?: string[];
  file_hash: string;
  content_fingerprint: string;
  file_url?: string;
  submitted_by_name?: string;
  submitted_by_email?: string;
  submitted_by_org?: string;
  batch_id?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`submissions:${ip}`);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (failsHoneypot(body[HONEYPOT_FIELD])) {
    return NextResponse.json({ ok: true, id: 'honeypot' });
  }

  if (!body.title?.trim()) return NextResponse.json({ error: 'missing_title' }, { status: 400 });
  if (!body.file_hash) return NextResponse.json({ error: 'missing_file_hash' }, { status: 400 });
  if (body.title.length > 500) return NextResponse.json({ error: 'title_too_long' }, { status: 400 });
  if ((body.abstract_original ?? '').length > 10000) {
    return NextResponse.json({ error: 'abstract_too_long' }, { status: 400 });
  }

  const saved = await createSubmission({
    title: body.title.trim(),
    author: body.author,
    organization: body.organization ?? null,
    date_published: body.date_published ?? null,
    abstract_original: body.abstract_original,
    abstract_translations: body.abstract_translations,
    language: body.language ?? null,
    themes: body.themes ?? [],
    document_type: body.document_type ?? null,
    governorates: body.governorates ?? [],
    keywords: body.keywords ?? [],
    file_hash: body.file_hash,
    content_fingerprint: body.content_fingerprint,
    file_url: body.file_url,
    submitted_by_name: body.submitted_by_name,
    submitted_by_email: body.submitted_by_email,
    submitted_by_org: body.submitted_by_org,
    batch_id: body.batch_id,
  });

  await sendNotification({
    type: 'submissions',
    subject: `New submission: ${saved.title}`,
    lines: [
      `id: ${saved.id}`,
      `title: ${saved.title}`,
      `status: ${saved.status}`,
      `author: ${saved.author ?? '(none)'}`,
      `organization: ${saved.organization ?? '(none)'}`,
      `submitted_by_name: ${saved.submitted_by_name ?? '(none)'}`,
      `submitted_by_email: ${saved.submitted_by_email ?? '(none)'}`,
      `date_submitted: ${saved.date_submitted}`,
    ],
  });

  return NextResponse.json({ ok: true, id: saved.id, status: saved.status });
}
