import type { CountryCode, Currency, ProviderKey } from '@/shared/types/common.types';

export interface CountryOption {
  code: CountryCode;
  label: string;
  currencies: Currency[];
  providers: ProviderKey[];
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'ZW', label: 'Zimbabwe', currencies: ['USD', 'ZWL', 'ZiG'], providers: ['ecocash'], flag: '🇿🇼' },
  { code: 'ZA', label: 'South Africa', currencies: ['ZAR'], providers: ['ozow'], flag: '🇿🇦' },
  { code: 'KE', label: 'Kenya', currencies: ['KES'], providers: ['mpesa'], flag: '🇰🇪' },
  { code: 'NG', label: 'Nigeria', currencies: ['NGN'], providers: ['pawapay'], flag: '🇳🇬' },
  { code: 'GH', label: 'Ghana', currencies: ['GHS'], providers: ['mtn'], flag: '🇬🇭' },
  { code: 'UG', label: 'Uganda', currencies: ['UGX'], providers: ['mtn', 'airtel'], flag: '🇺🇬' },
  { code: 'TZ', label: 'Tanzania', currencies: ['TZS'], providers: ['mpesa'], flag: '🇹🇿' },
];

export const PHASE_1_COUNTRIES: CountryCode[] = ['ZW', 'ZA'];
