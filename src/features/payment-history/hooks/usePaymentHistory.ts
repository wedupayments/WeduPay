import { useQuery } from '@tanstack/react-query';
import { fetchPaymentHistory } from '../api/history.api';
import type { PaymentHistoryFilters } from '../types/history.types';

export function usePaymentHistory(filters: PaymentHistoryFilters) {
  return useQuery({
    queryKey: ['payment-history', filters],
    queryFn: () => fetchPaymentHistory(filters),
    staleTime: 30 * 1000,
  });
}
