"use client";

import { useState } from "react";

interface EcoCashPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function EcoCashPayment({
  amount,
  onSuccess,
  onError,
  onCancel,
}: EcoCashPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/ecocash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "USD",
          phoneNumber: digits,
          description: "WeduPay Wallet Funding",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Payment initiation failed");
      }

      setSuccess(true);
      setInstructions(data.meta?.instructions || [
        "Check your phone for the STK push",
        "Enter your EcoCash PIN",
        "Wait for confirmation",
      ]);
      setTransactionId(data.data?.id);

      if (data.data?.attributes?.status === "COMPLETED") {
        onSuccess(data.data.id);
      } else {
        setTimeout(() => {
          onSuccess(data.data?.id);
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 p-6 bg-white dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-primary/10">
        <div className="text-center space-y-4">
          <div className="size-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">
              hourglass_empty
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Payment Initiated
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Please check your phone and enter your EcoCash PIN to confirm
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-primary/5 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-slate-900 dark:text-white">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Phone</span>
            <span className="font-bold text-slate-900 dark:text-white">{phoneNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Provider</span>
            <span className="font-bold text-primary">EcoCash</span>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">info</span>
            Instructions
          </h4>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
            {instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                {instruction}
              </li>
            ))}
          </ul>
        </div>

        {transactionId && (
          <p className="text-xs text-slate-400 text-center">
            Transaction ID: {transactionId}
          </p>
        )}

        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="size-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary">
            phone_android
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Pay with EcoCash
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Enter your EcoCash registered phone number
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Phone Number
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
            +263
          </span>
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="77 123 4567"
            className="w-full pl-16 pr-4 py-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-background-dark text-slate-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            maxLength={12}
            inputMode="numeric"
            autoFocus
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Enter without the leading 0 (e.g., 771234567)
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-primary/5 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 dark:text-slate-400">Amount</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary shrink-0">eco</span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-primary">EcoCash</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You will receive an STK push on your phone. Enter your PIN to confirm the payment.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || phoneNumber.replace(/\D/g, "").length < 9}
          className="flex-1 py-4 rounded-xl bg-primary text-background-dark font-bold shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Processing...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">send</span>
              Pay ${amount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
