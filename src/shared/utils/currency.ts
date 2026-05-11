import type { Currency } from '@/shared/types/common.types';
import { CURRENCY_SYMBOLS } from '@/shared/constants/currencies';

export function formatAmount(amount: number, currency: Currency | string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
