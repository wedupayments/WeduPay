import { useQuery } from '@tanstack/react-query';
import { fetchDepositStatus } from '../api/payment.api';
import { PAYMENT_POLL_INTERVAL_MS, PAYMENT_POLL_MAX_ATTEMPTS } from '../constants/payment.constants';

export function useDepositStatus(depositId: string | null) {
  let attempts = 0;

  return useQuery({
    queryKey: ['deposit-status', depositId],
    queryFn: () => {
      attempts += 1;
      return fetchDepositStatus(depositId!);
    },
    enabled: !!depositId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'EXPIRED') return false;
      if (attempts >= PAYMENT_POLL_MAX_ATTEMPTS) return false;
      return PAYMENT_POLL_INTERVAL_MS;
    },
    staleTime: 0,
  });
}
