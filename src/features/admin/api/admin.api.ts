import { apiClient } from '@/shared/api/client';
import type { PaginatedResponse, ApiResponse } from '@/shared/api/types';
import type { AdminPaymentOrder, AdminOrderFilters, SettlementSummaryData } from '../types/admin.types';

export async function fetchAdminOrders(
  filters: AdminOrderFilters
): Promise<PaginatedResponse<AdminPaymentOrder>> {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
    ...(filters.status && { status: filters.status }),
    ...(filters.country && { country: filters.country }),
    ...(filters.provider && { provider: filters.provider }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && { to: filters.to }),
  });

  const res = await apiClient.get<PaginatedResponse<AdminPaymentOrder>>(
    `/api/v1/admin/orders?${params}`
  );
  return res.data;
}

export async function fetchSettlementSummary(): Promise<SettlementSummaryData> {
  const res = await apiClient.get<ApiResponse<SettlementSummaryData>>(
    '/api/v1/admin/settlements/summary'
  );
  return res.data.data;
}

export async function triggerManualSettlement(orderId: string): Promise<void> {
  await apiClient.post(`/api/v1/admin/settlements/settle/${orderId}`);
}
