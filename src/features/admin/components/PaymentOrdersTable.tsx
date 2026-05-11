'use client';

import { formatUsd, formatAmount } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { PageSpinner } from '@/shared/components/ui/Spinner';
import { Alert } from '@/shared/components/ui/Alert';
import { PaymentStatusBadge } from '@/features/payment-history/components/PaymentStatusBadge';
import type { AdminPaymentOrder } from '../types/admin.types';

interface PaymentOrdersTableProps {
  orders: AdminPaymentOrder[];
  isLoading: boolean;
  error: unknown;
}

export function PaymentOrdersTable({ orders, isLoading, error }: PaymentOrdersTableProps) {
  if (isLoading) return <PageSpinner label="Loading orders…" />;
  if (error) return <Alert variant="error">Could not load payment orders</Alert>;
  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
        <p className="mt-2 text-sm text-slate-500">No orders</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {['Date', 'User', 'Amount (USD)', 'Local', 'Provider', 'Status'].map((h) => (
              <th key={h} className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-3 pr-4 text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
              <td className="py-3 pr-4">
                <p className="font-medium text-slate-900 dark:text-white">{o.userEmail}</p>
              </td>
              <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                {formatUsd(o.amountUsd)}
              </td>
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                {formatAmount(o.localAmount, o.localCurrency)}
              </td>
              <td className="py-3 pr-4 capitalize text-slate-600 dark:text-slate-400">
                {o.provider}
              </td>
              <td className="py-3">
                <PaymentStatusBadge status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
