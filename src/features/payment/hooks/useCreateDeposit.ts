import { useMutation } from '@tanstack/react-query';
import { createDeposit } from '../api/payment.api';
import type { CreateDepositRequest } from '../types/payment.types';

export function useCreateDeposit() {
  return useMutation({
    mutationFn: (body: CreateDepositRequest) => createDeposit(body),
  });
}
