"use client";

import { useEffect, useMemo, useState } from "react";
import { getOpenExchangeRatesProviderLabel } from "@/lib/open-exchange-rates";

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "ZWL", name: "Zimbabwean Dollar" },
  { code: "ZAR", name: "South African Rand" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
];

type ConversionResult = {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  fee: number;
  totalAmount: number;
  source?: string;
  provider?: string;
  updatedAt?: string;
};

interface QuickFXCalculatorProps {
  compact?: boolean;
  className?: string;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  initialAmount?: number | string;
  triggerLabel?: string;
}

export function QuickFXCalculator({
  compact = false,
  className = "",
  initialFromCurrency = "USD",
  initialToCurrency = "KES",
  initialAmount = "100",
  triggerLabel = "Quick FX",
}: QuickFXCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);
  const [amount, setAmount] = useState(String(initialAmount));
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const triggerClassName = compact
    ? "flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:border-primary/20 dark:hover:bg-primary/10"
    : "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-primary dark:border-primary/20 dark:text-slate-200 dark:hover:bg-primary/10";

  const providerLabel = useMemo(() => {
    return getOpenExchangeRatesProviderLabel(result?.source, result?.provider);
  }, [result?.provider, result?.source]);

  useEffect(() => {
    if (!isOpen) {
      setFromCurrency(initialFromCurrency);
      setToCurrency(initialToCurrency);
      setAmount(String(initialAmount));
      setResult(null);
      setError("");
    }
  }, [initialAmount, initialFromCurrency, initialToCurrency, isOpen]);

  useEffect(() => {
    if (!isOpen || !amount || parseFloat(amount) <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      void handleConvert();
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, amount, fromCurrency, toCurrency]);

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/fx/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
      );
      const data = await response.json();

      if (data.success) {
        setResult(data.conversion);
      } else {
        setError(data.error || "Conversion failed");
        setResult(null);
      }
    } catch (err) {
      setError("Failed to convert currency");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${triggerClassName} ${className}`.trim()}
        aria-label="Open quick FX calculator"
        title="Quick FX Calculator"
      >
        <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
        {!compact && <span>{triggerLabel}</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-primary/10 dark:bg-background-dark">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-primary/10">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Quick FX Calculator
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Check a live conversion without leaving this page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-primary/10"
                aria-label="Close FX calculator"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  From
                </label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="Enter amount"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="min-w-[132px] rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-primary/20 dark:text-slate-300 dark:hover:bg-primary/10"
                  aria-label="Swap currencies"
                >
                  <span className="material-symbols-outlined">swap_vert</span>
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  To
                </label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    {result ? result.convertedAmount.toFixed(2) : "0.00"}
                  </div>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="min-w-[132px] rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : result ? (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-primary/10 dark:bg-primary/5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Rate</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      1 {result.from} = {result.rate.toFixed(4)} {result.to}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Converted</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {result.convertedAmount.toFixed(2)} {result.to}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Fee estimate</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {result.fee.toFixed(2)} {result.to}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm dark:border-primary/10">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Total</span>
                    <span className="text-lg font-black text-primary">
                      {result.totalAmount.toFixed(2)} {result.to}
                    </span>
                  </div>
                  <div className="space-y-1 pt-1 text-xs text-slate-500 dark:text-slate-400">
                    <p>{providerLabel}</p>
                    {result.updatedAt && (
                      <p>Updated {new Date(result.updatedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
