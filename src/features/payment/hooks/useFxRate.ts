import { useQuery } from '@tanstack/react-query';
import { fetchFxRate } from '../api/payment.api';
import type { Currency } from '@/shared/types/common.types';

export function useFxRate(from: Currency, to: Currency, enabled = true) {
  return useQuery({
    queryKey: ['fx-rate', from, to],
    queryFn: () => fetchFxRate(from, to),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    enabled,
  });
}
