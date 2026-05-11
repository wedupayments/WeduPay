'use client';

import { useEffect } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Spinner } from '@/shared/components/ui/Spinner';
import { formatAmount, formatUsd } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { useFxRate } from '../hooks/useFxRate';
import type { Currency } from '@/shared/types/common.types';

interface FxRateCardProps {
  amountUsd: number;
  toCurrency: Currency;
  onRateLoaded?: (rate: number) => void;
}

export function FxRateCard({ amountUsd, toCurrency, onRateLoaded }: FxRateCardProps) {
  const { data: rate, isLoading, error } = useFxRate('USD', toCurrency);

  useEffect(() => {
    if (rate && onRateLoaded) onRateLoaded(rate.rate);
  }, [rate, onRateLoaded]);

  const localAmount = rate ? amountUsd * rate.rate : null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600 dark:text-slate-400">Exchange rate</span>
        {isLoading && <Spinner size="sm" />}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">Could not load rate</p>
      )}

      {rate && (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatAmount(rate.rate, toCurrency)}
            </span>
            <span className="text-sm text-slate-500">per USD</span>
          </div>

          {localAmount !== null && (
            <div className="mt-3 rounded-lg bg-white p-3 dark:bg-slate-800">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">You pay</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatUsd(amountUsd)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Provider receives</span>
                <span className="font-medium text-primary">{formatAmount(localAmount, toCurrency)}</span>
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-slate-400">
            Rate updated {formatDateTime(rate.updatedAt)} · Valid 15 min
          </p>
        </>
      )}
    </Card>
  );
}
