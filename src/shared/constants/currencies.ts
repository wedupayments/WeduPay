import type { Currency } from '@/shared/types/common.types';

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'US Dollar',
  ZWL: 'Zimbabwe Dollar',
  ZiG: 'Zimbabwe Gold',
  ZAR: 'South African Rand',
  KES: 'Kenyan Shilling',
  NGN: 'Nigerian Naira',
  GHS: 'Ghanaian Cedi',
  UGX: 'Ugandan Shilling',
  TZS: 'Tanzanian Shilling',
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  ZWL: 'ZWL',
  ZiG: 'ZiG',
  ZAR: 'R',
  KES: 'KSh',
  NGN: '₦',
  GHS: 'GH₵',
  UGX: 'USh',
  TZS: 'TSh',
};
