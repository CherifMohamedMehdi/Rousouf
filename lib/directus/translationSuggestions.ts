/**
 * Writes to the `translation_suggestions` collection (server-side only,
 * using DIRECTUS_TOKEN).
 */
import { randomUUID } from 'node:crypto';
import type { TranslationSuggestion } from '@/types/directus';

export interface CreateTranslationSuggestionInput {
  document: string;
  language: string;
  pdf_file: string;
  file_hash: string;
  content_fingerprint: string;
  suggested_by_email?: string;
  note?: string;
}

export async function createTranslationSuggestion(
  payload: CreateTranslationSuggestionInput,
): Promise<TranslationSuggestion> {
  const baseUrl = process.env.DIRECTUS_URL?.replace(/\/$/, '');
  const token = process.env.DIRECTUS_TOKEN;
  if (!baseUrl || !token) {
    throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN are required');
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  const res = await fetch(`${baseUrl}/items/translation_suggestions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id,
      document: payload.document,
      language: payload.language,
      pdf_file: payload.pdf_file,
      file_hash: payload.file_hash,
      content_fingerprint: payload.content_fingerprint,
      suggested_by_email: payload.suggested_by_email ?? null,
      note: payload.note ?? null,
      status: 'pending',
      date_submitted: now,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`translation_suggestions write failed: ${res.status} ${await res.text()}`);
  }

  const text = await res.text();
  const json = (text ? (JSON.parse(text) as { data?: Partial<TranslationSuggestion> }) : { data: {} }) as {
    data?: Partial<TranslationSuggestion>;
  };

  return {
    id: json.data?.id ?? id,
    document: payload.document,
    language: payload.language,
    pdf_file: payload.pdf_file,
    file_hash: payload.file_hash,
    content_fingerprint: payload.content_fingerprint,
    suggested_by_email: payload.suggested_by_email,
    note: payload.note,
    status: (json.data?.status as TranslationSuggestion['status']) ?? 'pending',
    admin_note: json.data?.admin_note,
    date_submitted: json.data?.date_submitted ?? now,
    date_reviewed: json.data?.date_reviewed ?? null,
  };
}
