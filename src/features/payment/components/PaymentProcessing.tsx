'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { useDepositStatus } from '../hooks/useDepositStatus';

interface PaymentProcessingProps {
  depositId: string;
  onSuccess: () => void;
  onFailed: () => void;
}

export function PaymentProcessing({ depositId, onSuccess, onFailed }: PaymentProcessingProps) {
  const { data, error } = useDepositStatus(depositId);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data) return;
    if (data.status === 'COMPLETED') onSuccess();
    if (data.status === 'FAILED' || data.status === 'EXPIRED') onFailed();
  }, [data, onSuccess, onFailed]);

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <Spinner size="lg" />
      <div>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          Waiting for payment{dots}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Check your phone and enter your PIN to confirm
        </p>
      </div>

      {error && <Alert variant="error">Could not check payment status. Retrying…</Alert>}

      {data && (
        <p className="text-xs text-slate-400">
          Status: <span className="capitalize">{data.status.toLowerCase()}</span>
        </p>
      )}
    </div>
  );
}
