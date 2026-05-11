'use client';

import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Alert } from '@/shared/components/ui/Alert';
import { FxRateCard } from './FxRateCard';
import { PHASE_1_PROVIDERS } from '../constants/payment.constants';
import { COUNTRIES } from '@/shared/constants/countries';
import type { CountryCode, Currency, ProviderKey } from '@/shared/types/common.types';
import { useState } from 'react';

interface ProviderSelectorProps {
  amountUsd: number;
  country: CountryCode;
  onNext: (provider: ProviderKey, phoneNumber: string, currency: Currency, rate: number) => void;
  onBack: () => void;
}

export function ProviderSelector({ amountUsd, country, onNext, onBack }: ProviderSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fxRate, setFxRate] = useState<number>(0);

  const countryData = COUNTRIES.find((c) => c.code === country);
  const availableProviders = PHASE_1_PROVIDERS.filter((p) => p.country === country);
  const chosenProvider = availableProviders.find((p) => p.key === selectedProvider);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProvider || !chosenProvider) {
      setError('Select a payment provider');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Enter your mobile money number');
      return;
    }
    if (!fxRate) {
      setError('Exchange rate not loaded yet, please wait');
      return;
    }
    setError(null);
    onNext(selectedProvider, phoneNumber.trim(), chosenProvider.currency, fxRate);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {countryData && chosenProvider && (
        <FxRateCard
          amountUsd={amountUsd}
          toCurrency={chosenProvider.currency}
          onRateLoaded={setFxRate}
        />
      )}

      <div>
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          Payment method
        </p>
        <div className="space-y-2">
          {availableProviders.map((provider) => (
            <button
              key={provider.key}
              type="button"
              onClick={() => setSelectedProvider(provider.key)}
              className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${
                selectedProvider === provider.key
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 hover:border-primary/50 dark:border-slate-700'
              }`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {provider.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">{provider.name}</p>
                <p className="text-xs text-slate-500">
                  {provider.currency} · max {provider.currency} {provider.maxAmount.toLocaleString()}
                </p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 ${
                selectedProvider === provider.key
                  ? 'border-primary bg-primary'
                  : 'border-slate-300 dark:border-slate-600'
              }`} />
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Mobile money number"
        type="tel"
        placeholder="+263771234567"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        hint="Include country code (e.g. +263 for Zimbabwe)"
        required
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack} fullWidth>
          Back
        </Button>
        <Button type="submit" fullWidth>
          Continue
        </Button>
      </div>
    </form>
  );
}
