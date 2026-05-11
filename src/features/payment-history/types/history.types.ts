import type { Currency, PaymentStatus, ProviderKey } from '@/shared/types/common.types';

export interface PaymentRecord {
  id: string;
  depositId: string;
  amountUsd: number;
  localAmount: number;
  localCurrency: Currency;
  status: PaymentStatus;
  provider: ProviderKey;
  phoneNumber: string;
  providerReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryFilters {
  status?: PaymentStatus;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}
