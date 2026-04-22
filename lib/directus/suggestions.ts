/**
 * Suggestion writes.
 *
 * In mock mode this console.logs and returns a synthetic id so the UI can
 * render a confirmation. In production it writes to the Directus
 * `suggestions` collection (public-create permission).
 */
import { randomUUID } from 'node:crypto';
import { isMockMode } from './client';
import type { Suggestion, SuggestionTargetType } from '@/types/directus';

export interface SuggestionPayload {
  target_type: SuggestionTargetType;
  document_id?: string | null;
  organization_id?: string | null;
  suggested_by_email?: string;
  field_name: string;
  field_label: string;
  current_value: string;
  suggested_value: string;
  note?: string;
}

export async function createSuggestion(payload: SuggestionPayload): Promise<Suggestion> {
  const now = new Date().toISOString();
  const record: Suggestion = {
    id: randomUUID(),
    ...payload,
    status: 'pending',
    date_submitted: now,
  };
  if (isMockMode()) {
    console.log('[mock suggestions]', record);
    return record;
  }

  const baseUrl = process.env.DIRECTUS_URL;
  if (!baseUrl) return record;
  const token = process.env.DIRECTUS_TOKEN;
  const res = await fetch(`${baseUrl}/items/suggestions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      target_type: payload.target_type,
      document_id: payload.document_id ?? null,
      organization_id: payload.organization_id ?? null,
      suggested_by_email: payload.suggested_by_email,
      field_name: payload.field_name,
      field_label: payload.field_label,
      current_value: payload.current_value,
      suggested_value: payload.suggested_value,
      note: payload.note,
      status: 'pending',
      date_submitted: now,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`suggestions write failed: ${res.status}`);
  }

  const json = (await res.json()) as { data?: Partial<Suggestion> };
  return {
    ...record,
    ...json.data,
    id: json.data?.id ?? record.id,
    status: (json.data?.status as Suggestion['status']) ?? 'pending',
    date_submitted: json.data?.date_submitted ?? now,
  };
}
