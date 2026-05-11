import type { Currency, PaymentStatus, ProviderKey, CountryCode } from '@/shared/types/common.types';

export interface FxRate {
  from: Currency;
  to: Currency;
  rate: number;
  inverseRate: number;
  updatedAt: string;
}

export interface FxQuote {
  quoteId: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  totalUsd: number;
  expiresAt: string;
}

export interface ProviderOption {
  key: ProviderKey;
  name: string;
  country: CountryCode;
  currency: Currency;
  minAmount: number;
  maxAmount: number;
  logoUrl?: string;
}

export interface CreateDepositRequest {
  phoneNumber: string;
  amount: number;
  currency: Currency;
  description?: string;
  provider?: ProviderKey;
  country?: CountryCode;
  walletId?: string;
}

export interface CreateDepositResponse {
  success: boolean;
  depositId: string;
  status: PaymentStatus;
  provider: ProviderKey;
}

export interface DepositStatus {
  depositId: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  provider: ProviderKey;
  providerReference?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStep = 'amount' | 'provider' | 'confirm' | 'processing' | 'success' | 'failed';

export interface PaymentFormState {
  amountUsd: number;
  country: CountryCode | '';
  provider: ProviderKey | '';
  phoneNumber: string;
  quote: FxQuote | null;
}
