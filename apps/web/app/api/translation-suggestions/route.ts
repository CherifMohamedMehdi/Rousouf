/**
 * POST /api/translation-suggestions
 *
 * multipart/form-data:
 *  - document_id, language_id, file_hash, content_fingerprint (required)
 *  - file: PDF (required)
 *  - note, email (optional)
 *  - honeypot field name from lib/honeypot
 *
 * Uploads the PDF to Directus, then inserts `translation_suggestions`.
 * Requires DIRECTUS_URL + DIRECTUS_TOKEN. Target document must be published.
 */
import { NextResponse } from 'next/server';
import { createTranslationSuggestion } from '@/lib/directus/translationSuggestions';
import { uploadPdfBufferToDirectus } from '@/lib/directus/uploadPdf';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { failsHoneypot, HONEYPOT_FIELD } from '@/lib/honeypot';
import { sendNotification } from '@/lib/notifications';

export const runtime = 'edge';

function maxUploadBytes(): number {
  const mb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? process.env.MAX_UPLOAD_MB ?? 50);
  return (Number.isFinite(mb) ? mb : 50) * 1024 * 1024;
}

async function directusFetch(path: string): Promise<Response> {
  const base = process.env.DIRECTUS_URL!.replace(/\/$/, '');
  const token = process.env.DIRECTUS_TOKEN!;
  return fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`translation-suggestions:${ip}`);
  if (!rl.ok) return rateLimitResponse(rl);

  if (!process.env.DIRECTUS_URL || !process.env.DIRECTUS_TOKEN) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const honeypot = form.get(HONEYPOT_FIELD);
  if (failsHoneypot(honeypot)) {
    return NextResponse.json({ ok: true, id: 'honeypot' });
  }

  const documentId = String(form.get('document_id') ?? '').trim();
  const languageId = String(form.get('language_id') ?? '').trim();
  const fileHash = String(form.get('file_hash') ?? '').trim();
  const fingerprint = String(form.get('content_fingerprint') ?? '').trim();
  const note = String(form.get('note') ?? '').trim() || undefined;
  const email = String(form.get('email') ?? '').trim() || undefined;
  const file = form.get('file');

  if (!documentId || !languageId || !fileHash || !fingerprint) {
    return NextResponse.json({ error: 'missing_required' }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 });
  }

  const maxBytes = maxUploadBytes();
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'too_large' }, { status: 400 });
  }

  const mime = file.type || '';
  const name = file.name || '';
  if (mime !== 'application/pdf' && !name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'invalid_pdf' }, { status: 400 });
  }

  const docRes = await directusFetch(`/items/documents/${encodeURIComponent(documentId)}?fields=id,status`);
  if (docRes.status === 404) {
    return NextResponse.json({ error: 'unknown_document' }, { status: 404 });
  }
  if (!docRes.ok) {
    return NextResponse.json({ error: 'document_lookup_failed' }, { status: 502 });
  }
  const docJson = (await docRes.json()) as { data?: { status?: string } };
  const status = docJson.data?.status;
  if (status !== 'published') {
    return NextResponse.json({ error: 'not_published' }, { status: 400 });
  }

  const langRes = await directusFetch(`/items/languages/${encodeURIComponent(languageId)}?fields=id`);
  if (langRes.status === 404 || !langRes.ok) {
    return NextResponse.json({ error: 'unknown_language' }, { status: 400 });
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: 'read_failed' }, { status: 400 });
  }

  let pdfFileId: string;
  try {
    const uploaded = await uploadPdfBufferToDirectus(buffer, name || 'translation.pdf');
    pdfFileId = uploaded.id;
  } catch {
    return NextResponse.json({ error: 'upload_failed' }, { status: 502 });
  }

  let saved;
  try {
    saved = await createTranslationSuggestion({
      document: documentId,
      language: languageId,
      pdf_file: pdfFileId,
      file_hash: fileHash,
      content_fingerprint: fingerprint,
      suggested_by_email: email,
      note,
    });
  } catch {
    return NextResponse.json({ error: 'save_failed' }, { status: 502 });
  }

  await sendNotification({
    type: 'suggestions',
    subject: `New translation PDF suggestion: document ${documentId}`,
    lines: [
      `id: ${saved.id}`,
      `document: ${documentId}`,
      `language: ${languageId}`,
      `pdf_file: ${pdfFileId}`,
      `submitter_email: ${email ?? '(none)'}`,
      '',
      `file_hash: ${fileHash}`,
      `fingerprint: ${fingerprint.slice(0, 200)}${fingerprint.length > 200 ? '…' : ''}`,
      '',
      `note: ${note ?? '(none)'}`,
    ],
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
