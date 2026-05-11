'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { PaymentAmountForm } from '../components/PaymentAmountForm';
import { ProviderSelector } from '../components/ProviderSelector';
import { PaymentConfirmation } from '../components/PaymentConfirmation';
import { PaymentProcessing } from '../components/PaymentProcessing';
import { PaymentSuccess } from '../components/PaymentSuccess';
import { PaymentFailed } from '../components/PaymentFailed';
import { useCreateDeposit } from '../hooks/useCreateDeposit';
import { getErrorMessage } from '@/shared/utils/error';
import type { CountryCode, Currency, ProviderKey } from '@/shared/types/common.types';
import type { PaymentFormState, PaymentStep } from '../types/payment.types';

const STEP_LABELS: Record<PaymentStep, string> = {
  amount: 'Amount',
  provider: 'Provider',
  confirm: 'Confirm',
  processing: 'Processing',
  success: 'Done',
  failed: 'Failed',
};

const WIZARD_STEPS: PaymentStep[] = ['amount', 'provider', 'confirm'];

const initialState: PaymentFormState = {
  amountUsd: 0,
  country: '',
  provider: '',
  phoneNumber: '',
  quote: null,
};

export default function PaymentPage() {
  const [step, setStep] = useState<PaymentStep>('amount');
  const [form, setForm] = useState<PaymentFormState>(initialState);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { mutateAsync: createDeposit, isPending } = useCreateDeposit();

  function handleAmountNext(amountUsd: number, country: CountryCode) {
    setForm((f) => ({ ...f, amountUsd, country }));
    setStep('provider');
  }

  function handleProviderNext(provider: ProviderKey, phoneNumber: string, currency: Currency) {
    setForm((f) => ({ ...f, provider, phoneNumber }));
    setStep('confirm');
  }

  async function handleConfirm() {
    setSubmitError(null);
    try {
      const result = await createDeposit({
        phoneNumber: form.phoneNumber,
        amount: form.amountUsd,
        currency: 'USD',
        description: 'BYU-Pathway tuition payment',
        provider: form.provider as ProviderKey,
        country: form.country as CountryCode,
      });
      setDepositId(result.depositId);
      setStep('processing');
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }

  const handleSuccess = useCallback(() => setStep('success'), []);
  const handleFailed = useCallback(() => setStep('failed'), []);
  function handleRetry() {
    setForm(initialState);
    setDepositId(null);
    setSubmitError(null);
    setStep('amount');
  }

  const currentWizardIndex = WIZARD_STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Make a Payment</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pay your BYU-Pathway tuition using mobile money
        </p>
      </div>

      {/* Step indicator — only during wizard */}
      {currentWizardIndex >= 0 && (
        <div className="mb-6 flex items-center gap-2">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  i < currentWizardIndex
                    ? 'bg-primary text-background-dark'
                    : i === currentWizardIndex
                    ? 'border-2 border-primary text-primary'
                    : 'border-2 border-slate-300 text-slate-400 dark:border-slate-600'
                }`}
              >
                {i < currentWizardIndex ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  i === currentWizardIndex ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                }`}
              >
                {STEP_LABELS[s]}
              </span>
              {i < WIZARD_STEPS.length - 1 && (
                <div className={`h-px flex-1 ${i < currentWizardIndex ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ width: 24 }} />
              )}
            </div>
          ))}
        </div>
      )}

      <Card>
        {step === 'amount' && <PaymentAmountForm onNext={handleAmountNext} />}
        {step === 'provider' && (
          <ProviderSelector
            amountUsd={form.amountUsd}
            country={form.country as CountryCode}
            onNext={handleProviderNext}
            onBack={() => setStep('amount')}
          />
        )}
        {step === 'confirm' && (
          <PaymentConfirmation
            state={form}
            isSubmitting={isPending}
            error={submitError}
            onConfirm={handleConfirm}
            onBack={() => setStep('provider')}
          />
        )}
        {step === 'processing' && depositId && (
          <PaymentProcessing
            depositId={depositId}
            onSuccess={handleSuccess}
            onFailed={handleFailed}
          />
        )}
        {step === 'success' && depositId && (
          <PaymentSuccess state={form} depositId={depositId} />
        )}
        {step === 'failed' && (
          <PaymentFailed depositId={depositId ?? undefined} onRetry={handleRetry} />
        )}
      </Card>
    </div>
  );
}
