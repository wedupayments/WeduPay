import { apiClient } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';
import type {
  FxRate,
  CreateDepositRequest,
  CreateDepositResponse,
  DepositStatus,
} from '../types/payment.types';
import type { Currency } from '@/shared/types/common.types';

export async function fetchFxRate(from: Currency, to: Currency): Promise<FxRate> {
  const res = await apiClient.get<{ success: boolean; rate: FxRate }>(
    `/api/fx/rates?from=${from}&to=${to}`
  );
  return res.data.rate;
}

export async function createDeposit(body: CreateDepositRequest): Promise<CreateDepositResponse> {
  const res = await apiClient.post<ApiResponse<CreateDepositResponse>>('/api/v1/deposits', body);
  return res.data.data;
}

export async function fetchDepositStatus(depositId: string): Promise<DepositStatus> {
  const res = await apiClient.get<ApiResponse<DepositStatus>>(`/api/v1/deposits/${depositId}`);
  return res.data.data;
}
