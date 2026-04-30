/**
 * Submission writes (public document uploads).
 *
 * A submission is a pending candidate that editors will review in Directus
 * before promoting to the `documents` collection.
 */
import { isMockMode } from './client';
import type { Submission } from '@/types/directus';

export type SubmissionPayload = Omit<Submission, 'id' | 'status' | 'date_submitted'>;

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function createSubmission(payload: SubmissionPayload): Promise<Submission> {
  const record: Submission = {
    id: makeId(),
    ...payload,
    status: 'pending',
    date_submitted: new Date().toISOString(),
  };
  if (isMockMode()) {
    console.log('[mock submissions]', record.id, record.title);
    return record;
  }

  const baseUrl = process.env.DIRECTUS_URL;
  if (!baseUrl) return record;
  const token = process.env.DIRECTUS_TOKEN;
  const res = await fetch(`${baseUrl}/items/submissions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      id: record.id,
      ...payload,
      status: 'pending',
      date_submitted: record.date_submitted,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`submissions write failed: ${res.status}`);
  }

  const text = await res.text();
  const json = (text ? (JSON.parse(text) as { data?: Partial<Submission> }) : { data: {} }) as {
    data?: Partial<Submission>;
  };
  return {
    ...record,
    ...json.data,
    id: json.data?.id ?? record.id,
    status: (json.data?.status as Submission['status']) ?? 'pending',
    date_submitted: json.data?.date_submitted ?? record.date_submitted,
  };
}
