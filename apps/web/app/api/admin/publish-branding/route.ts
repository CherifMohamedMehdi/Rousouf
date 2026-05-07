/**
 * POST /api/admin/publish-branding — copy draft branding → published (+ snapshot previous).
 *
 * Protected by BRANDING_WEBHOOK_SECRET via header x-branding-secret or Authorization: Bearer ...
 */
import { NextResponse } from 'next/server';

import {
  fetchBrandingSettingsRow,
  isBrandingWebhookAuthorized,
  patchBrandingSettings,
  publishedFieldsFromSnapshot,
  readDraftSnapshot,
  readPublishedSnapshot,
  revalidateBrandingLayouts,
} from '@/lib/branding/webhookRoutes';

export async function POST(req: Request) {
  if (!(await isBrandingWebhookAuthorized(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const row = await fetchBrandingSettingsRow();
    const previous = readPublishedSnapshot(row);
    const draft = readDraftSnapshot(row);
    const actor = req.headers.get('x-branding-actor') ?? 'directus-flow';
    await patchBrandingSettings({
      ...publishedFieldsFromSnapshot(draft),
      previous_published_snapshot: previous,
      last_published_at: new Date().toISOString(),
      last_published_by: actor,
    });
    revalidateBrandingLayouts();
    return NextResponse.json({ ok: true, action: 'published' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'publish failed' },
      { status: 500 },
    );
  }
}
