const MAX_SOURCE_URL_LEN = 2048;

/** Returns normalized URL string, or `null` if empty/invalid. */
export function normalizeOptionalSourceUrl(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_SOURCE_URL_LEN) return null;
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  return trimmed;
}
