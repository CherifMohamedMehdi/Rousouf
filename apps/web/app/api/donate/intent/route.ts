/**
 * POST /api/donate/intent
 *
 * Kicks off a donation with the active payment provider (see
 * lib/payments/index.ts). When no provider is configured, the "disabled"
 * provider stores a `donation_leads` row so the team can follow up when
 * payments go live — while still honoring the donor's privacy preferences.
 *
 * The response is one of:
 *   { kind: 'redirect', url }             → 3DS/hosted page provider
 *   { kind: 'embed', clientSecret }       → embedded card input (Stripe)
 *   { kind: 'provider_not_configured' }   → UI shows thank-you for later
 */
import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { failsHoneypot, HONEYPOT_FIELD } from '@/lib/honeypot';
import { siteUrl } from '@/lib/utils';
import type { CurrencyCode, DonationFrequency } from '@/types/directus';

interface Body {
  amount?: number;
  currency?: CurrencyCode;
  frequency?: DonationFrequency;
  tierId?: string | null;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  isAnonymous?: boolean;
  displayOnHomepage?: boolean;
  publicDisplayName?: string;
  locale?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`donate:${ip}`);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (failsHoneypot(body[HONEYPOT_FIELD])) {
    return NextResponse.json({ kind: 'provider_not_configured' });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 1_000_000) {
    return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
  }
  if (!body.currency || !['TND', 'USD', 'EUR'].includes(body.currency)) {
    return NextResponse.json({ error: 'invalid_currency' }, { status: 400 });
  }
  if (!body.frequency || !['one_time', 'monthly'].includes(body.frequency)) {
    return NextResponse.json({ error: 'invalid_frequency' }, { status: 400 });
  }

  const locale = body.locale ?? 'fr';
  const provider = getPaymentProvider();
  const result = await provider.createIntent({
    amount,
    currency: body.currency,
    frequency: body.frequency,
    tierId: body.tierId,
    donorName: body.donorName,
    donorEmail: body.donorEmail,
    message: body.message,
    isAnonymous: Boolean(body.isAnonymous),
    displayOnHomepage: Boolean(body.displayOnHomepage),
    publicDisplayName: body.publicDisplayName,
    locale,
    successUrl: `${siteUrl()}/${locale}/donate/thank-you`,
    cancelUrl: `${siteUrl()}/${locale}/donate?status=cancel`,
  });

  return NextResponse.json(result);
}
