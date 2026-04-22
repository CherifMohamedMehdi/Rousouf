/**
 * Payment-provider seam.
 *
 * The donate page is built UI-first. Every provider interaction goes through
 * `PaymentProvider.createIntent`. Choosing a provider means:
 *   1. Creating a file like `stripe.ts` here that implements `PaymentProvider`.
 *   2. Adding its id to this union.
 *   3. Returning it from `pickProvider()` in index.ts based on PAYMENT_PROVIDER.
 *
 * No page or API route should ever import a provider directly.
 */
import type { CurrencyCode, DonationFrequency, DonationLead } from '@/types/directus';

export type PaymentProviderId = 'disabled' | 'stripe' | 'paymee' | 'konnect' | 'flouci';

export interface DonationIntentInput {
  amount: number;
  currency: CurrencyCode;
  frequency: DonationFrequency;
  tierId?: string | null;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  isAnonymous: boolean;
  displayOnHomepage: boolean;
  publicDisplayName?: string;
  locale: string;
  successUrl: string;
  cancelUrl: string;
}

export type DonationIntentResult =
  | { kind: 'redirect'; url: string; reference: string }
  | { kind: 'embed'; clientSecret: string; reference: string }
  | { kind: 'provider_not_configured'; reference: string; lead: DonationLead };

export interface WebhookEvent {
  kind: 'succeeded' | 'failed' | 'refunded' | 'ignored';
  reference?: string;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  createIntent(input: DonationIntentInput): Promise<DonationIntentResult>;
  verifyWebhook?(req: Request): Promise<WebhookEvent>;
}
