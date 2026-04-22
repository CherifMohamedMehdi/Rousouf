/**
 * Content fingerprinting for fuzzy duplicate detection.
 *
 * Lowercases, strips punctuation, collapses whitespace, then keeps the first
 * 2,000 words of the extracted PDF text. Short enough to index with pg_trgm
 * and long enough that minor edits don't defeat the match.
 */

const FINGERPRINT_WORD_CAP = 2000;

export function buildFingerprint(rawText: string): string {
  if (!rawText) return '';
  const normalized = rawText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.split(' ').slice(0, FINGERPRINT_WORD_CAP).join(' ');
}
