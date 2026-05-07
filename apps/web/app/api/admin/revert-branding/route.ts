/**
 * POST /api/admin/revert-branding — restore previous_published_snapshot into published columns.
 *
 * Protected by BRANDING_WEBHOOK_SECRET (same as publish-branding).
 */
import { NextResponse } from 'next/server';

import {
  fetchBrandingSettingsRow,
  isBrandingWebhookAuthorized,
  patchBrandingSettings,
  publishedFieldsFromSnapshot,
  readPublishedSnapshot,
  readStoredPreviousSnapshot,
  revalidateBrandingLayouts,
} from '@/lib/branding/webhookRoutes';

export async function POST(req: Request) {
  if (!(await isBrandingWebhookAuthorized(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const row = await fetchBrandingSettingsRow();
    const previous = readStoredPreviousSnapshot(row);
    if (!previous) {
      return NextResponse.json({ ok: false, error: 'no_previous_snapshot' }, { status: 409 });
    }
    const currentPublished = readPublishedSnapshot(row);
    const actor = req.headers.get('x-branding-actor') ?? 'directus-flow';
    await patchBrandingSettings({
      ...publishedFieldsFromSnapshot(previous),
      previous_published_snapshot: currentPublished,
      last_reverted_at: new Date().toISOString(),
      last_reverted_by: actor,
    });
    revalidateBrandingLayouts();
    return NextResponse.json({ ok: true, action: 'reverted' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'revert failed' },
      { status: 500 },
    );
  }
}
