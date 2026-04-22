/**
 * GET /api/donors/highlights?limit=30
 *
 * Returns a privacy-safe sample of opted-in donors for the DonorsWall.
 * Only `display_name` and `month` are exposed — amount, email, message,
 * provider and provider_reference are never returned.
 *
 * Server-side shuffle so order varies per request. No logging of IP or UA.
 */
import { NextResponse } from 'next/server';
import { getPublicDonors } from '@/lib/directus/donations';

export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '30')));
  const donors = await getPublicDonors(limit);
  return NextResponse.json(
    { donors },
    {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=60',
      },
    },
  );
}
