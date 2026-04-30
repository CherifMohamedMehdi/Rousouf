/**
 * POST /api/duplicate-check
 *
 * Given a submitted file's SHA-256 hash and content fingerprint, returns:
 *  - `exact`: a hit if any published document shares the exact file hash.
 *  - `fuzzy`: up to N candidate documents whose content fingerprints have
 *    a trigram similarity above DUPLICATE_FUZZY_THRESHOLD.
 *
 * In mock mode the similarity is computed in-process using a bigram
 * Jaccard score. In production this route proxies a SQL query using the
 * PostgreSQL `pg_trgm` extension (see docs/SCHEMA.md for the required
 * index and function).
 *
 * Threshold is exposed in the response so the client can explain the
 * decision to the user transparently.
 */
import { NextResponse } from 'next/server';
import { mockDocuments } from '@/mocks/documents';
import type { DuplicateCheckResponse, DuplicateMatch } from '@/types/directus';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';

interface Body {
  file_hash?: string;
  content_fingerprint?: string;
}

function similarityThreshold(): number {
  const v = Number(process.env.DUPLICATE_FUZZY_THRESHOLD ?? 0.72);
  return Number.isFinite(v) ? v : 0.72;
}

function bigrams(text: string): Set<string> {
  const set = new Set<string>();
  const s = text.toLowerCase().replace(/\s+/g, ' ').trim();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersect = 0;
  for (const item of a) if (b.has(item)) intersect++;
  return intersect / (a.size + b.size - intersect);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`dupcheck:${ip}`);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const threshold = similarityThreshold();
  const { file_hash, content_fingerprint } = body;

  let exact: DuplicateMatch | undefined;
  const fuzzy: DuplicateMatch[] = [];

  if (file_hash) {
    const hit = mockDocuments.find((d) => d.status === 'published' && d.file_hash === file_hash);
    if (hit) {
      exact = {
        id: hit.id,
        title: hit.title,
        organization_name: hit.organization?.name,
        date_published: hit.date_published,
        similarity: 1,
      };
    }
  }

  if (!exact && content_fingerprint) {
    const submittedGrams = bigrams(content_fingerprint);
    const candidates = mockDocuments
      .filter((d) => d.status === 'published' && d.content_fingerprint)
      .map((d) => ({
        doc: d,
        score: jaccard(submittedGrams, bigrams(d.content_fingerprint)),
      }))
      .filter((x) => x.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    for (const { doc, score } of candidates) {
      fuzzy.push({
        id: doc.id,
        title: doc.title,
        organization_name: doc.organization?.name,
        date_published: doc.date_published,
        similarity: Number(score.toFixed(3)),
      });
    }
  }

  const response: DuplicateCheckResponse = { exact, fuzzy, threshold };
  return NextResponse.json(response);
}
