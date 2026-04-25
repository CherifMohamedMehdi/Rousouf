/**
 * Contact message writes.
 */
import { randomUUID } from 'node:crypto';
import { isMockMode } from './client';
import type { ContactMessage } from '@/types/directus';

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function createContactMessage(payload: ContactPayload): Promise<ContactMessage> {
  const record: ContactMessage = {
    id: randomUUID(),
    ...payload,
    status: 'new',
    date_created: new Date().toISOString(),
  };
  if (isMockMode()) {
    console.log('[mock contact]', record.email, record.subject);
    return record;
  }

  const baseUrl = process.env.DIRECTUS_URL;
  if (!baseUrl) return record;
  const token = process.env.DIRECTUS_TOKEN;
  const res = await fetch(`${baseUrl}/items/contact_messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      id: record.id,
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      status: 'new',
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`contact_messages write failed: ${res.status}`);
  }

  const text = await res.text();
  const json = (text ? (JSON.parse(text) as { data?: Partial<ContactMessage> }) : { data: {} }) as {
    data?: Partial<ContactMessage>;
  };
  return {
    ...record,
    ...json.data,
    id: json.data?.id ?? record.id,
    status: (json.data?.status as ContactMessage['status']) ?? 'new',
    date_created: json.data?.date_created ?? record.date_created,
  };
}
