'use client';

import { useState, useEffect } from 'react';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  fee: number;
  totalAmount: number;
  source?: string;
  updatedAt?: string;
}

export function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('ZWL');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/fx/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
      );
      const data = await response.json();

      if (data.success) {
        setResult(data.conversion);
      } else {
        setError(data.error || 'Conversion failed');
      }
    } catch (err) {
      setError('Failed to convert currency');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const timer = setTimeout(() => {
        handleConvert();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fromCurrency, toCurrency, amount]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
        Currency Converter
      </h2>

      <div className="space-y-4">
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            From
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter amount"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Swap currencies"
          >
            <svg
              className="w-6 h-6 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            To
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={result ? result.convertedAmount.toFixed(2) : '0.00'}
              readOnly
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Conversion Details */}
        {result && !loading && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Exchange Rate:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                1 {result.from} = {result.rate.toFixed(4)} {result.to}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Converted Amount:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {result.convertedAmount.toFixed(2)} {result.to}
              </span>
            </div>
            {result.fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Fee:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {result.fee.toFixed(2)} {result.to}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="font-medium text-slate-700 dark:text-slate-300">Total:</span>
              <span className="font-bold text-lg text-primary">
                {result.totalAmount.toFixed(2)} {result.to}
              </span>
            </div>
            {result.updatedAt && (
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                Rate updated: {new Date(result.updatedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}
