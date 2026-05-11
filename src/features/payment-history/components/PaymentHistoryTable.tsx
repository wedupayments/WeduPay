'use client';

import { formatUsd, formatAmount } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { PageSpinner } from '@/shared/components/ui/Spinner';
import { Alert } from '@/shared/components/ui/Alert';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import type { PaymentRecord } from '../types/history.types';

interface PaymentHistoryTableProps {
  records: PaymentRecord[];
  isLoading: boolean;
  error: unknown;
}

export function PaymentHistoryTable({ records, isLoading, error }: PaymentHistoryTableProps) {
  if (isLoading) return <PageSpinner label="Loading history…" />;
  if (error) return <Alert variant="error">Could not load payment history</Alert>;
  if (records.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
        <p className="mt-2 text-sm text-slate-500">No payments yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="pb-3 pr-4 text-left font-medium text-slate-500">Date</th>
            <th className="pb-3 pr-4 text-left font-medium text-slate-500">Amount (USD)</th>
            <th className="pb-3 pr-4 text-left font-medium text-slate-500">Local amount</th>
            <th className="pb-3 pr-4 text-left font-medium text-slate-500">Provider</th>
            <th className="pb-3 text-left font-medium text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                {formatDateTime(r.createdAt)}
              </td>
              <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                {formatUsd(r.amountUsd)}
              </td>
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                {formatAmount(r.localAmount, r.localCurrency)}
              </td>
              <td className="py-3 pr-4 capitalize text-slate-600 dark:text-slate-400">
                {r.provider}
              </td>
              <td className="py-3">
                <PaymentStatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
