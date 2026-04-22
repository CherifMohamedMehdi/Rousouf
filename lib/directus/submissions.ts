/**
 * Submission writes (public document uploads).
 *
 * A submission is a pending candidate that editors will review in Directus
 * before promoting to the `documents` collection.
 */
import { randomUUID } from 'node:crypto';
import { isMockMode } from './client';
import type { Submission } from '@/types/directus';

export type SubmissionPayload = Omit<Submission, 'id' | 'status' | 'date_submitted'>;

export async function createSubmission(payload: SubmissionPayload): Promise<Submission> {
  const record: Submission = {
    id: randomUUID(),
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
      ...payload,
      status: 'pending',
      date_submitted: record.date_submitted,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`submissions write failed: ${res.status}`);
  }

  const json = (await res.json()) as { data?: Partial<Submission> };
  return {
    ...record,
    ...json.data,
    id: json.data?.id ?? record.id,
    status: (json.data?.status as Submission['status']) ?? 'pending',
    date_submitted: json.data?.date_submitted ?? record.date_submitted,
  };
}
