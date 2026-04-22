/**
 * Factory that returns the active payment provider.
 *
 * Reads PAYMENT_PROVIDER from env. Defaults to `disabled` which captures
 * donor interest as a lead. To add a provider (e.g. Stripe), create a new
 * file implementing `PaymentProvider` and add a branch below.
 */
import type { PaymentProvider, PaymentProviderId } from './provider';
import { disabledProvider } from './disabled';

export function getPaymentProvider(): PaymentProvider {
  const id = (process.env.PAYMENT_PROVIDER ?? 'disabled') as PaymentProviderId;
  switch (id) {
    case 'disabled':
      return disabledProvider;
    case 'stripe':
    case 'paymee':
    case 'konnect':
    case 'flouci':
      // Plug the real implementation in here once the provider is chosen.
      return disabledProvider;
    default:
      return disabledProvider;
  }
}

export type { PaymentProvider, DonationIntentInput, DonationIntentResult } from './provider';
