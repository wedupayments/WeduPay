'use client';

import { Button } from '@/shared/components/ui/Button';

interface PaymentFailedProps {
  depositId?: string;
  onRetry: () => void;
}

export function PaymentFailed({ depositId, onRetry }: PaymentFailedProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
          cancel
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">Payment Failed</p>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          The payment could not be completed. No funds were deducted.
        </p>
      </div>

      {depositId && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-800 dark:bg-red-900/20">
          <p className="text-xs text-slate-500">Reference</p>
          <p className="mt-0.5 font-mono text-sm font-medium text-slate-900 dark:text-white break-all">
            {depositId}
          </p>
        </div>
      )}

      <div className="flex w-full flex-col gap-3">
        <Button onClick={onRetry} fullWidth>
          Try again
        </Button>
      </div>
    </div>
  );
}
