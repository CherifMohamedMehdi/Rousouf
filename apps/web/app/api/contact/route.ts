/**
 * POST /api/contact — writes to the Directus `contact_messages` collection.
 * Public-writable. Honeypot-protected. Rate-limited per IP.
 */
import { NextResponse } from 'next/server';
import { createContactMessage } from '@/lib/directus/contactMessages';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { failsHoneypot, HONEYPOT_FIELD } from '@/lib/honeypot';
import { isEmailLike } from '@/lib/utils';
import { sendNotification } from '@/lib/notifications';

interface Body {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`contact:${ip}`);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (failsHoneypot(body[HONEYPOT_FIELD])) {
    return NextResponse.json({ ok: true });
  }

  if (!body.name?.trim() || !body.email || !isEmailLike(body.email)) {
    return NextResponse.json({ error: 'invalid_identity' }, { status: 400 });
  }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'missing_message' }, { status: 400 });
  }
  if (body.message.length > 10000) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  const saved = await createContactMessage({
    name: body.name.trim(),
    email: body.email.trim(),
    subject: body.subject?.trim(),
    message: body.message,
  });

  await sendNotification({
    type: 'contact',
    subject: `New contact message: ${saved.subject ?? '(no subject)'}`,
    lines: [
      `id: ${saved.id}`,
      `name: ${saved.name}`,
      `email: ${saved.email}`,
      `subject: ${saved.subject ?? '(none)'}`,
      '',
      saved.message ?? '',
    ],
  });

  return NextResponse.json({ ok: true });
}
