/**
 * Heuristic metadata detection from extracted PDF text.
 *
 * Deliberately small: infers script/language, best-guess title (first
 * non-trivial line), and best-guess publication date (first 4-digit year
 * between 1900 and now + 1). Anything we pull here renders with an
 * "auto-detected" badge so the contributor can verify before submitting.
 */

export type DetectedLanguage = 'ar' | 'fr' | 'en' | 'other';

export interface DetectedMetadata {
  language: DetectedLanguage;
  title?: string;
  year?: number;
}

export function detectMetadata(text: string): DetectedMetadata {
  const language = detectLanguage(text);
  const title = detectTitle(text);
  const year = detectYear(text);
  return { language, title, year };
}

function detectLanguage(text: string): DetectedLanguage {
  if (!text) return 'other';
  const arabicMatches = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const totalLetters = text.match(/\p{L}/gu)?.length ?? 1;
  if (arabicMatches / totalLetters > 0.3) return 'ar';

  const frenchMarkers = text.match(/\b(?:le|la|les|une|des|pour|dans|avec|être|avoir|gouvernement|rapport)\b/gi)?.length ?? 0;
  const englishMarkers = text.match(/\b(?:the|and|of|to|for|with|report|government|study|research)\b/gi)?.length ?? 0;
  if (frenchMarkers > englishMarkers) return 'fr';
  if (englishMarkers > 0) return 'en';
  return 'other';
}

function detectTitle(text: string): string | undefined {
  if (!text) return undefined;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8 && l.length < 180);
  const candidate = lines.find((l) => !/^\d+$/.test(l) && /[\p{L}]/u.test(l));
  return candidate;
}

function detectYear(text: string): number | undefined {
  const nowYear = new Date().getFullYear();
  const match = text.match(/\b(19\d{2}|20\d{2})\b/);
  if (!match) return undefined;
  const year = Number(match[1]);
  if (year < 1900 || year > nowYear + 1) return undefined;
  return year;
}
