import type { ProviderOption } from '../types/payment.types';

export const PHASE_1_PROVIDERS: ProviderOption[] = [
  {
    key: 'ecocash',
    name: 'EcoCash',
    country: 'ZW',
    currency: 'ZWL',
    minAmount: 1,
    maxAmount: 5000,
  },
  {
    key: 'pawapay',
    name: 'PawaPay',
    country: 'ZW',
    currency: 'ZWL',
    minAmount: 1,
    maxAmount: 5000,
  },
  {
    key: 'ozow',
    name: 'Ozow',
    country: 'ZA',
    currency: 'ZAR',
    minAmount: 10,
    maxAmount: 50000,
  },
];

export const FX_QUOTE_EXPIRY_MINUTES = 15;

export const PAYMENT_POLL_INTERVAL_MS = 3000;
export const PAYMENT_POLL_MAX_ATTEMPTS = 40;

export const BYU_PATHWAY_USD_AMOUNTS = [150, 300, 450, 600] as const;
