/**
 * SHA-256 hash of a File (browser) via the Web Crypto API.
 *
 * Runs entirely client-side so the hash reaches our server even when the
 * user ultimately decides not to submit the file — critical for
 * duplicate-detection UX.
 */

export async function sha256File(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return toHex(digest);
}

export async function sha256String(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return toHex(digest);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
