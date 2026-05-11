'use client';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Alert } from '@/shared/components/ui/Alert';
import { formatUsd } from '@/shared/utils/currency';
import { PHASE_1_PROVIDERS } from '../constants/payment.constants';
import type { PaymentFormState } from '../types/payment.types';

interface PaymentConfirmationProps {
  state: PaymentFormState;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export function PaymentConfirmation({
  state,
  isSubmitting,
  error,
  onConfirm,
  onBack,
}: PaymentConfirmationProps) {
  const providerData = PHASE_1_PROVIDERS.find((p) => p.key === state.provider);

  return (
    <div className="space-y-6">
      <Card>
        <dl className="space-y-3">
          <Row label="Amount (USD)" value={formatUsd(state.amountUsd)} />
          <Row label="Provider" value={providerData?.name ?? state.provider} />
          <Row label="Phone number" value={state.phoneNumber} />
          {state.quote && (
            <>
              <Row label="Exchange rate" value={`${state.quote.rate} ${state.quote.toCurrency}/USD`} />
              <Row
                label={`Amount (${state.quote.toCurrency})`}
                value={`${state.quote.toCurrency} ${state.quote.toAmount.toLocaleString()}`}
              />
            </>
          )}
        </dl>
      </Card>

      <Alert variant="info">
        You will receive an STK push on <strong>{state.phoneNumber}</strong>. Enter your PIN to
        complete the payment. The rate is locked for 15 minutes.
      </Alert>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack} fullWidth disabled={isSubmitting}>
          Back
        </Button>
        <Button type="button" onClick={onConfirm} loading={isSubmitting} fullWidth>
          {isSubmitting ? 'Sending…' : 'Confirm & Pay'}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
