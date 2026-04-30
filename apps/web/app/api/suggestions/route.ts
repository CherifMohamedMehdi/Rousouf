/**
 * POST /api/suggestions
 *
 * Public-writable endpoint used by <SuggestEditModal> on documents and
 * organizations. The same endpoint serves both surfaces — the caller
 * passes `target_type` plus the matching `target_id`, and we route to the
 * correct Directus collection field.
 *
 * Protections:
 *  - Honeypot field must be empty.
 *  - IP-based rate limit (defaults to 10/min; see lib/rateLimit.ts).
 *  - Suggested value must differ from current value.
 *
 * On success: returns `{ id }` for optional UI display, never the full row.
 */
import { NextResponse } from 'next/server';
import { createSuggestion } from '@/lib/directus/suggestions';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { failsHoneypot, HONEYPOT_FIELD } from '@/lib/honeypot';
import type { SuggestionTargetType } from '@/types/directus';
import { sendNotification } from '@/lib/notifications';

export const runtime = 'edge';

interface Body {
  target_type: SuggestionTargetType;
  target_id: string;
  field_name: string;
  field_label: string;
  current_value: string;
  suggested_value: string;
  note?: string;
  email?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`suggestions:${ip}`);
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

  if (!body.target_type || !['document', 'organization'].includes(body.target_type)) {
    return NextResponse.json({ error: 'invalid_target_type' }, { status: 400 });
  }
  if (!body.target_id || !body.field_name || !body.suggested_value) {
    return NextResponse.json({ error: 'missing_required' }, { status: 400 });
  }
  if (body.suggested_value.trim() === body.current_value.trim()) {
    return NextResponse.json({ error: 'unchanged' }, { status: 400 });
  }
  if (body.suggested_value.length > 5000) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  const saved = await createSuggestion({
    target_type: body.target_type,
    document_id: body.target_type === 'document' ? body.target_id : null,
    organization_id: body.target_type === 'organization' ? body.target_id : null,
    field_name: body.field_name,
    field_label: body.field_label,
    current_value: body.current_value ?? '',
    suggested_value: body.suggested_value,
    note: body.note,
    suggested_by_email: body.email,
  });

  await sendNotification({
    type: 'suggestions',
    subject: `New suggestion: ${body.target_type} / ${body.field_label || body.field_name}`,
    lines: [
      `id: ${saved.id}`,
      `target_type: ${body.target_type}`,
      `target_id: ${body.target_id}`,
      `field: ${body.field_name}`,
      `submitter_email: ${body.email ?? '(none)'}`,
      '',
      `current: ${body.current_value ?? ''}`,
      `suggested: ${body.suggested_value}`,
      '',
      `note: ${body.note ?? '(none)'}`,
    ],
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
