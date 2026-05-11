'use client';

import { Card, CardTitle } from '@/shared/components/ui/Card';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Alert } from '@/shared/components/ui/Alert';
import { formatUsd } from '@/shared/utils/currency';
import { useSettlementSummary } from '../hooks/useSettlementSummary';

export function SettlementSummary() {
  const { data, isLoading, error } = useSettlementSummary();

  if (isLoading) return <Spinner size="md" className="py-4" />;
  if (error) return <Alert variant="error">Could not load settlement summary</Alert>;
  if (!data) return null;

  const stats = [
    { label: 'Total orders', value: data.totalOrders.toString() },
    { label: 'Completed', value: data.completedOrders.toString() },
    { label: 'Total USD collected', value: formatUsd(data.totalUsd) },
    { label: 'Pending settlement', value: formatUsd(data.pendingUsd) },
    { label: 'Settled', value: formatUsd(data.settledUsd) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} padding="sm">
          <p className="text-xs text-slate-500">{s.label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
        </Card>
      ))}
    </div>
  );
}
