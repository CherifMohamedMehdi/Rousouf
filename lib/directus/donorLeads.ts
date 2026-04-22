/**
 * Donor-lead writes. Captures donor interest while a payment provider
 * has not been wired in yet (PAYMENT_PROVIDER=disabled).
 */
import { randomUUID } from 'node:crypto';
import { isMockMode } from './client';
import type { DonationLead } from '@/types/directus';

export type DonorLeadPayload = Omit<DonationLead, 'id' | 'status' | 'date_created'>;

export async function createDonorLead(payload: DonorLeadPayload): Promise<DonationLead> {
  const record: DonationLead = {
    id: randomUUID(),
    ...payload,
    status: 'new',
    date_created: new Date().toISOString(),
  };
  if (isMockMode()) {
    console.log('[mock donor-lead]', record.id, record.email ?? '(no email)', record.intended_amount);
    return record;
  }
  return record;
}
