import { apiClient } from '@/shared/api/client';
import type { PaginatedResponse } from '@/shared/api/types';
import type { PaymentRecord, PaymentHistoryFilters } from '../types/history.types';

export async function fetchPaymentHistory(
  filters: PaymentHistoryFilters
): Promise<PaginatedResponse<PaymentRecord>> {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
    ...(filters.status && { status: filters.status }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && { to: filters.to }),
  });

  const res = await apiClient.get<PaginatedResponse<PaymentRecord>>(
    `/api/v1/deposits?${params}`
  );
  return res.data;
}
