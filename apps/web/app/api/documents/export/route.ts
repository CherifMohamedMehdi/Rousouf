import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/directus/documents';
import { parseSearchParams } from '@/lib/search/urlParams';
import { toDocumentsCsv } from '@/lib/export/documentsCsv';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const paramsObject: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of url.searchParams.entries()) {
    const existing = paramsObject[key];
    if (existing === undefined) {
      paramsObject[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      paramsObject[key] = [existing, value];
    }
  }

  const parsed = parseSearchParams(paramsObject);
  const docs = await getDocuments({
    themeSlugs: parsed.themeSlugs,
    typeSlugs: parsed.typeSlugs,
    governorateSlugs: parsed.governorateSlugs,
    languageSlugs: parsed.languageSlugs,
    organizationSlugs: parsed.organizationSlugs,
    dynamicFilters: parsed.dynamicFilters,
    yearFrom: parsed.yearFrom,
    yearTo: parsed.yearTo,
    sort: parsed.sort === 'oldest' ? 'oldest' : 'recent',
    status: 'published',
    limit: 100000,
    offset: 0,
  });

  const csv = toDocumentsCsv(docs.items);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="roufouf-documents-${stamp}.csv"`,
      'cache-control': 'no-store',
    },
  });
}

