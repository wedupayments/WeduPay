'use client';

import Link from 'next/link';
import { formatUsd } from '@/shared/utils/currency';
import type { PaymentFormState } from '../types/payment.types';

interface PaymentSuccessProps {
  state: PaymentFormState;
  depositId: string;
}

export function PaymentSuccess({ state, depositId }: PaymentSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">
          check_circle
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">Payment Successful</p>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {formatUsd(state.amountUsd)} sent to BYU-Pathway
        </p>
      </div>

      <div className="w-full rounded-lg border border-green-200 bg-green-50 p-4 text-left dark:border-green-800 dark:bg-green-900/20">
        <p className="text-xs text-slate-500">Reference</p>
        <p className="mt-0.5 font-mono text-sm font-medium text-slate-900 dark:text-white break-all">
          {depositId}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/dashboard/customer"
          className="flex w-full items-center justify-center rounded-lg border border-transparent bg-primary px-4 py-3 text-sm font-medium text-background-dark transition hover:brightness-110"
        >
          Back to dashboard
        </Link>
        <Link
          href="/dashboard/customer/history"
          className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-300"
        >
          View payment history
        </Link>
      </div>
    </div>
  );
}
