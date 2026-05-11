'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Alert } from '@/shared/components/ui/Alert';
import { PHASE_1_COUNTRIES, COUNTRIES } from '@/shared/constants/countries';
import { BYU_PATHWAY_USD_AMOUNTS } from '../constants/payment.constants';
import type { CountryCode } from '@/shared/types/common.types';

interface PaymentAmountFormProps {
  onNext: (amountUsd: number, country: CountryCode) => void;
}

const phase1CountryData = COUNTRIES.filter((c) => (PHASE_1_COUNTRIES as string[]).includes(c.code));
const countryOptions = phase1CountryData.map((c) => ({ value: c.code, label: `${c.flag} ${c.label}` }));

const QUICK_AMOUNTS = BYU_PATHWAY_USD_AMOUNTS;

export function PaymentAmountForm({ onNext }: PaymentAmountFormProps) {
  const [amount, setAmount] = useState('');
  const [country, setCountry] = useState<CountryCode | ''>('');
  const [error, setError] = useState<string | null>(null);

  function handleQuick(val: number) {
    setAmount(String(val));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter a valid USD amount');
      return;
    }
    if (!country) {
      setError('Select your country');
      return;
    }
    setError(null);
    onNext(parsed, country as CountryCode);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Quick select (USD)</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleQuick(val)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                amount === String(val)
                  ? 'border-primary bg-primary text-background-dark'
                  : 'border-slate-300 text-slate-700 hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-300'
              }`}
            >
              ${val}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Amount (USD)"
        type="number"
        min="1"
        step="0.01"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <Select
        label="Your country"
        options={countryOptions}
        placeholder="Select country"
        value={country}
        onChange={(e) => setCountry(e.target.value as CountryCode)}
        required
      />

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" fullWidth>
        Continue
      </Button>
    </form>
  );
}
