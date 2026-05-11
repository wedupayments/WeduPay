import { useQuery } from '@tanstack/react-query';
import { fetchSettlementSummary } from '../api/admin.api';

export function useSettlementSummary() {
  return useQuery({
    queryKey: ['settlement-summary'],
    queryFn: fetchSettlementSummary,
    staleTime: 60 * 1000,
  });
}
