'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { triggerManualSettlement } from '../api/admin.api';
import { getErrorMessage } from '@/shared/utils/error';

interface ManualSettlementButtonProps {
  orderId: string;
}

export function ManualSettlementButton({ orderId }: ManualSettlementButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => triggerManualSettlement(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['settlement-summary'] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <div className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <Button
        size="sm"
        variant="secondary"
        loading={isPending}
        onClick={() => mutate()}
      >
        Mark settled
      </Button>
    </div>
  );
}
