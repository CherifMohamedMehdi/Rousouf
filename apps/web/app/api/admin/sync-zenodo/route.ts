/**
 * POST /api/admin/sync-zenodo
 *
 * Protected by the same Directus/admin webhook secret used for other admin
 * maintenance routes. Body: { "documentId": "..." }.
 */
import { NextResponse } from 'next/server';

import { isBrandingWebhookAuthorized } from '@/lib/branding/webhookRoutes';
import { syncDocumentToZenodo } from '@/lib/zenodo/sync';

export async function POST(req: Request) {
  if (!(await isBrandingWebhookAuthorized(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { documentId?: unknown };
    const documentId = typeof body.documentId === 'string' ? body.documentId.trim() : '';
    if (!documentId) {
      return NextResponse.json({ ok: false, error: 'documentId is required' }, { status: 400 });
    }

    const result = await syncDocumentToZenodo(documentId);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, action: 'failed', error: error instanceof Error ? error.message : 'Zenodo sync failed' },
      { status: 500 },
    );
  }
}
