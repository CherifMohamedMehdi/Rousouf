/**
 * POST /api/admin/revalidate-branding — invalidate Next.js layout cache only.
 *
 * Use when a Directus **Flow** updates `branding_settings` in the CMS and the
 * site must pick up new `published_*` values without going through the
 * publish-branding route.
 */
import { NextResponse } from 'next/server';

import { isBrandingWebhookAuthorized, revalidateBrandingLayouts } from '@/lib/branding/webhookRoutes';

export async function POST(req: Request) {
  if (!(await isBrandingWebhookAuthorized(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    revalidateBrandingLayouts();
    return NextResponse.json({ ok: true, action: 'revalidated' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'revalidate failed' },
      { status: 500 },
    );
  }
}
