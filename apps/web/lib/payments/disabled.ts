/**
 * The "disabled" payment provider. Used when no real provider is wired in.
 *
 * It captures donor interest as a `donation_leads` row and returns a result
 * that tells the frontend to show the "payments aren't live yet" thank-you
 * state. This preserves the user's privacy preferences so when a provider
 * is eventually wired in, opted-in donors can still be listed correctly.
 */
import type { PaymentProvider, DonationIntentInput, DonationIntentResult, WebhookEvent } from './provider';
import { createDonorLead } from '@/lib/directus/donorLeads';

export const disabledProvider: PaymentProvider = {
  id: 'disabled',
  async createIntent(input: DonationIntentInput): Promise<DonationIntentResult> {
    const lead = await createDonorLead({
      name: input.isAnonymous ? undefined : input.donorName,
      email: input.isAnonymous ? undefined : input.donorEmail,
      intended_amount: input.amount,
      currency: input.currency,
      frequency: input.frequency,
      message: input.message,
      is_anonymous_intent: input.isAnonymous,
      display_on_homepage_intent: input.displayOnHomepage,
      public_display_name_intent: input.publicDisplayName,
    });
    return { kind: 'provider_not_configured', reference: lead.id, lead };
  },
  async verifyWebhook(): Promise<WebhookEvent> {
    return { kind: 'ignored' };
  },
};
