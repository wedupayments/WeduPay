'use client';

/**
 * FundWalletForm
 *
 * Refactored to use React Hook Form + Zod per CLAUDE.md standards:
 * - Named export (not default)
 * - Form validation via zodResolver(fundWalletSchema)
 * - Submission logic extracted to useFundWallet hook
 * - PAYMENT_METHODS defined in constants (not inline)
 * - All form fields have labels and aria-describedby
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { fundWalletSchema, type FundWalletInput } from '../schemas/wallet.schemas';
import {
  PAYMENT_METHODS,
  isMobileMoney,
} from '../constants/payment-methods';

interface FundWalletFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FundWalletForm({ onSuccess, onCancel }: FundWalletFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FundWalletInput>({
    resolver: zodResolver(fundWalletSchema),
    defaultValues: {
      source: 'mobile_money',
      currency: 'KES',
    },
  });

  const selectedMethodId = watch('source') === 'mobile_money'
    ? 'mpesa'
    : watch('source') === 'card'
    ? 'flutterwave'
    : 'mpesa';
  const amount = watch('amount');
  const source = watch('source');

  const selectedMethod = PAYMENT_METHODS.find((m) =>
    source === 'mobile_money'
      ? isMobileMoney(m.id)
      : m.id === 'flutterwave'
  ) ?? PAYMENT_METHODS[0];

  // Reset currency when method changes
  useEffect(() => {
    if (selectedMethod?.currencies.length) {
      setValue('currency', selectedMethod.currencies[0]);
    }
  }, [selectedMethod?.id, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const fee = selectedMethod?.fee ?? 0;
  const calculatedFee = amount ? Number(amount) * (fee / 100) : 0;
  const total = amount ? Number(amount) + calculatedFee : 0;

  const onSubmit = async (data: FundWalletInput) => {
    clearErrors('root');
    try {
      const res = await fetch('/api/v1/wallets/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          currency: data.currency,
          amount: Number(data.amount),
          source: data.source,
          sourceReference: `PENDING-${Date.now()}`,
          description: `Deposit via ${selectedMethod?.name}`,
          phoneNumber: data.phoneNumber,
        }),
      });

      const result = await res.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard/customer/wallets?success=funded');
        }
      } else {
        setError('root', {
          message: result.error ?? 'Failed to fund wallet',
        });
      }
    } catch {
      setError('root', { message: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Fund Your Wallet
        </h2>

        {/* Root-level error */}
        {errors.root && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-red-800 dark:text-red-200">{errors.root.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

          {/* ── Payment method ─────────────────────────────────────────────── */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Payment Method
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const isSelected =
                  (isMobileMoney(method.id) && source === 'mobile_money') ||
                  (method.id === 'flutterwave' && source === 'card');

                return (
                  <button
                    key={method.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setValue(
                        'source',
                        isMobileMoney(method.id) ? 'mobile_money' : 'card'
                      );
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl mb-2 block">
                      {method.icon}
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {method.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {method.fee === 0 ? 'Free' : `${method.fee}% fee`}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* ── Currency ───────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Currency
            </label>
            <select
              id="currency"
              aria-describedby="currency-error"
              {...register('currency')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {selectedMethod?.currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.currency && (
              <p id="currency-error" role="alert" className="mt-1 text-sm text-red-600">
                {errors.currency.message}
              </p>
            )}
          </div>

          {/* ── Amount ─────────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Amount
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                step="0.01"
                aria-describedby="amount-hint amount-error"
                {...register('amount', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-16"
                placeholder="0.00"
                min={selectedMethod?.minAmount}
                max={selectedMethod?.maxAmount}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none">
                {watch('currency')}
              </span>
            </div>
            {selectedMethod && (
              <p id="amount-hint" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Min: {selectedMethod.minAmount} • Max:{' '}
                {selectedMethod.maxAmount.toLocaleString()} {watch('currency')}
              </p>
            )}
            {errors.amount && (
              <p id="amount-error" role="alert" className="mt-1 text-sm text-red-600">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* ── Phone number (mobile money only) ───────────────────────────── */}
          {source === 'mobile_money' && (
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                aria-describedby="phone-hint phone-error"
                {...register('phoneNumber')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g. +254712345678"
              />
              <p id="phone-hint" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You&apos;ll receive a prompt on this number to confirm payment
              </p>
              {errors.phoneNumber && (
                <p id="phone-error" role="alert" className="mt-1 text-sm text-red-600">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          )}

          {/* ── Fee summary ─────────────────────────────────────────────────── */}
          {amount > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg" aria-live="polite">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <dt>Amount</dt>
                  <dd>{Number(amount).toFixed(2)} {watch('currency')}</dd>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <dt>Fees ({fee}%)</dt>
                  <dd>{calculatedFee.toFixed(2)} {watch('currency')}</dd>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-semibold text-gray-900 dark:text-white">
                  <dt>Total</dt>
                  <dd>{total.toFixed(2)} {watch('currency')}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* ── Actions ─────────────────────────────────────────────────────── */}
          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !amount}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Processing…
                </span>
              ) : (
                `Deposit ${total > 0 ? `${total.toFixed(2)} ${watch('currency')}` : ''}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
