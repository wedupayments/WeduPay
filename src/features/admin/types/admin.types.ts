import type { Currency, PaymentStatus, ProviderKey, CountryCode } from '@/shared/types/common.types';

export interface AdminPaymentOrder {
  id: string;
  depositId: string;
  userId: string;
  userEmail: string;
  amountUsd: number;
  localAmount: number;
  localCurrency: Currency;
  fxRate: number;
  status: PaymentStatus;
  provider: ProviderKey;
  country: CountryCode;
  phoneNumber: string;
  providerReference?: string;
  createdAt: string;
  settledAt?: string;
}

export interface SettlementSummaryData {
  totalOrders: number;
  completedOrders: number;
  totalUsd: number;
  pendingUsd: number;
  settledUsd: number;
  byProvider: Record<ProviderKey, { count: number; amountUsd: number }>;
  byCountry: Record<CountryCode, { count: number; amountUsd: number }>;
}

export interface AdminOrderFilters {
  status?: PaymentStatus;
  country?: CountryCode;
  provider?: ProviderKey;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}
