/**
 * POST /api/donate/webhook — provider-agnostic webhook endpoint.
 *
 * Today this is a stub: no payment provider is wired, so `verifyWebhook`
 * on the `disabled` provider returns `{ kind: 'ignored' }` and we respond
 * 200 OK so providers don't retry during staging tests.
 *
 * When a real provider is picked (see lib/payments/provider.ts):
 *  - The provider's `verifyWebhook` implementation verifies the signature
 *    header and returns a normalized `WebhookEvent`.
 *  - On `kind: 'succeeded'` we'll write a `donations` row in Directus
 *    (with the privacy flags carried from the matching `donation_leads`
 *    record) — the DonorsWall on the homepage then reads the filtered
 *    public view.
 *  - On `kind: 'failed' | 'refunded'` we'll update the donation record's
 *    status accordingly.
 *
 * This route is intentionally independent of the UI so it can be called
 * by providers that post webhooks from their own infrastructure.
 */
import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';

export async function POST(req: Request) {
  const provider = getPaymentProvider();

  if (!provider.verifyWebhook) {
    return NextResponse.json({ ok: true, kind: 'ignored' });
  }

  try {
    const event = await provider.verifyWebhook(req);
    // When a real provider is wired in, fan out on event.kind here:
    //   - 'succeeded' → createDonationFromLead(event.reference)
    //   - 'failed' | 'refunded' → updateDonationStatus(event.reference, ...)
    //   - 'ignored' → no-op
    return NextResponse.json({ ok: true, kind: event.kind });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'invalid_webhook' },
      { status: 400 },
    );
  }
}
