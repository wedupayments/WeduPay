'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuickFXCalculator } from '@/components/fx/QuickFXCalculator';

interface Quote {
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  exchangeRate: number;
  fees: {
    transferFee: number;
    fxFee: number;
    totalFees: number;
  };
  totalDebit: number;
  estimatedDelivery: string;
  route: {
    provider: string;
    fxRoute: string;
  };
}

interface Recipient {
  id: string;
  name: string;
  phoneNumber: string;
  country: string;
  walletType: string;
}

interface Country {
  code: string;
  name: string;
  currency: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', flag: '🇸🇳' },
  { code: 'CI', name: 'Ivory Coast', currency: 'XOF', flag: '🇨🇮' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', flag: '🇿🇼' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN', flag: '🇲🇿' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', flag: '🇨🇲' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
];

const SEND_CURRENCIES = [
  { code: 'KES', label: 'KES' },
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
];

const inputClass =
  'w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

const selectClass =
  'w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

export default function P2PTransferForm() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'quote' | 'confirm' | 'processing'>('form');

  // Form state
  const [sendAmount, setSendAmount] = useState<number>(1000);
  const [sendCurrency, setSendCurrency] = useState<string>('KES');
  const [recipientCountry, setRecipientCountry] = useState<string>('TZ');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [saveRecipient, setSaveRecipient] = useState<boolean>(false);

  // Quote state
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string>('');

  // Transfer state
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string>('');

  // Wallet balance
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  // Saved recipients
  const [savedRecipients, setSavedRecipients] = useState<Recipient[]>([]);
  const [showRecipients, setShowRecipients] = useState<boolean>(false);

  // Terms checkbox
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  useEffect(() => {
    loadRecipients();
    fetchBalance(sendCurrency);
  }, []);

  useEffect(() => {
    fetchBalance(sendCurrency);
  }, [sendCurrency]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sendAmount > 0 && recipientCountry) {
        fetchQuote();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [sendAmount, recipientCountry, sendCurrency]);

  const fetchBalance = async (currency: string) => {
    try {
      const response = await fetch(`/api/v1/wallets/balance?currency=${currency}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableBalance(data.data?.availableBalance ?? null);
        }
      }
    } catch {
      // non-critical — silently ignore
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await fetch('/api/v1/transfers/p2p/recipients');
      const data = await response.json();
      if (data.success) {
        setSavedRecipients(data.recipients);
      }
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  };

  const selectRecipient = (recipient: Recipient) => {
    setRecipientPhone(recipient.phoneNumber);
    setRecipientName(recipient.name);
    setRecipientCountry(recipient.country);
    setShowRecipients(false);
  };

  const fetchQuote = async () => {
    if (!recipientCountry) return;
    setIsLoadingQuote(true);
    setQuoteError('');
    try {
      const response = await fetch('/api/v1/transfers/p2p/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendAmount,
          sendCurrency,
          recipientPhone: recipientPhone || '255700000000',
          recipientCountry,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setQuote(data.quote);
      } else {
        setQuoteError(data.error || 'Failed to get quote');
      }
    } catch {
      setQuoteError('Network error. Please try again.');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleExecuteTransfer = async () => {
    if (!quote) return;
    setIsTransferring(true);
    setTransferError('');
    try {
      const response = await fetch('/api/v1/transfers/p2p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendAmount,
          sendCurrency,
          recipientPhone,
          recipientCountry,
          recipientName,
          description,
          saveRecipient,
        }),
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/dashboard/customer/transfers/success?id=${data.transfer.reference}`);
      } else {
        setTransferError(data.error || 'Transfer failed. Please try again.');
        setStep('confirm');
      }
    } catch {
      setTransferError('Network error. Please try again.');
      setStep('confirm');
    } finally {
      setIsTransferring(false);
    }
  };

  const getCountryByCode = (code: string) => COUNTRIES.find((c) => c.code === code);
  const getSendCountry = () => getCountryByCode('KE');
  const getRecipientCountry = () => getCountryByCode(recipientCountry);
  const recipientCurrency = getRecipientCountry()?.currency || 'USD';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Send Money Abroad</h1>
        <p className="text-slate-600 dark:text-slate-400">Transfer money directly to mobile wallets across Africa</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Details', 'Quote', 'Confirm'].map((label, index) => {
            const stepKeys = ['form', 'quote', 'confirm'];
            const currentIndex = stepKeys.indexOf(step === 'processing' ? 'confirm' : step);
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex;

            return (
              <div key={label} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isComplete
                      ? 'bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    isActive
                      ? 'font-semibold text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {label}
                </span>
                {index < 2 && (
                  <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Transfer Form */}
      {step === 'form' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Transfer Details</h2>

          {/* Send Amount */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className={labelClass}>Amount to Send</label>
              <QuickFXCalculator
                initialFromCurrency={sendCurrency}
                initialToCurrency={recipientCurrency}
                initialAmount={sendAmount}
                triggerLabel="Preview FX"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(Number(e.target.value))}
                className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                  availableBalance !== null && sendAmount > availableBalance
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="Enter amount"
                min="1"
              />
              <select
                value={sendCurrency}
                onChange={(e) => setSendCurrency(e.target.value)}
                className="px-3 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium"
              >
                {SEND_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            {availableBalance !== null && (
              <p className={`mt-1.5 text-xs ${
                sendAmount > availableBalance
                  ? 'text-red-500 dark:text-red-400 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                Available: {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sendCurrency}
                {sendAmount > availableBalance && ' — insufficient funds'}
              </p>
            )}
          </div>

          {/* Recipient Country */}
          <div className="mb-6">
            <label className={labelClass}>Recipient Country</label>
            <select
              value={recipientCountry}
              onChange={(e) => setRecipientCountry(e.target.value)}
              className={selectClass}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Phone */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass.replace('mb-2', '')}>Recipient Phone Number</label>
              <button
                type="button"
                onClick={() => setShowRecipients(!showRecipients)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Choose from saved
              </button>
            </div>

            {showRecipients && savedRecipients.length > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Saved Recipients:</p>
                {savedRecipients.map((recipient) => (
                  <button
                    key={recipient.id}
                    onClick={() => selectRecipient(recipient)}
                    className="w-full text-left p-2 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer transition"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{recipient.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">{recipient.phoneNumber}</span>
                    <span className="text-slate-400 ml-2">
                      {getCountryByCode(recipient.country)?.flag}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className={inputClass}
              placeholder="e.g., 255712345678"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Include country code (e.g., 255 for Tanzania)
            </p>
          </div>

          {/* Recipient Name */}
          <div className="mb-6">
            <label className={labelClass}>Recipient Name</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className={inputClass}
              placeholder="Full name"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className={labelClass}>Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="e.g., Family support, Business payment"
            />
          </div>

          {/* Save Recipient */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveRecipient}
                onChange={(e) => setSaveRecipient(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Save this recipient for future transfers
              </span>
            </label>
          </div>

          <button
            onClick={() => {
              fetchQuote();
              setStep('quote');
            }}
            disabled={!sendAmount || !recipientPhone || !recipientCountry || (availableBalance !== null && sendAmount > availableBalance)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white disabled:text-slate-400 dark:disabled:text-slate-500 py-3 rounded-lg font-semibold transition"
          >
            Get Quote
          </button>
        </div>
      )}

      {/* Step 2: Quote */}
      {step === 'quote' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Transfer Quote</h2>

          {isLoadingQuote ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-slate-600 dark:text-slate-400">Getting best exchange rate...</p>
            </div>
          ) : quoteError ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{quoteError}</p>
              <button
                onClick={() => setStep('form')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Go Back
              </button>
            </div>
          ) : quote ? (
            <>
              {/* Rate card */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-blue-100 text-sm">You Send</p>
                    <p className="text-2xl font-bold">{quote.sendAmount.toLocaleString()} {quote.sendCurrency}</p>
                    <p className="text-blue-100 text-sm mt-1">
                      {getSendCountry()?.flag} {getSendCountry()?.name}
                    </p>
                  </div>
                  <div className="text-2xl">→</div>
                  <div className="text-center">
                    <p className="text-blue-100 text-sm">Recipient Gets</p>
                    <p className="text-2xl font-bold">{quote.receiveAmount.toLocaleString()} {quote.receiveCurrency}</p>
                    <p className="text-blue-100 text-sm mt-1">
                      {getRecipientCountry()?.flag} {getRecipientCountry()?.name}
                    </p>
                  </div>
                </div>
                <div className="border-t border-blue-400 pt-4 flex items-center justify-between text-sm">
                  <span>Exchange Rate</span>
                  <span className="font-semibold">
                    1 {quote.sendCurrency} = {quote.exchangeRate.toFixed(2)} {quote.receiveCurrency}
                  </span>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Fee Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Transfer Fee</span>
                    <span>{quote.fees.transferFee.toLocaleString()} {quote.sendCurrency}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>FX Fee (included in rate)</span>
                    <span>{quote.fees.fxFee.toLocaleString()} {quote.sendCurrency}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>Total Fees</span>
                    <span>{quote.fees.totalFees.toLocaleString()} {quote.sendCurrency}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                    <span>Total to Debit</span>
                    <span>{quote.totalDebit.toLocaleString()} {quote.sendCurrency}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">{quote.estimatedDelivery}</p>
                    <p className="text-sm text-green-700 dark:text-green-400">via {quote.route.provider}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Continue
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && quote && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Confirm Transfer</h2>

          {/* Summary */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Transfer Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Amount</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {quote.sendAmount.toLocaleString()} {quote.sendCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Recipient</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {recipientName || recipientPhone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Country</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {getRecipientCountry()?.flag} {getRecipientCountry()?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Phone</span>
                <span className="font-medium text-slate-900 dark:text-white">{recipientPhone}</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Description</span>
                  <span className="font-medium text-slate-900 dark:text-white">{description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount confirmation */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6 text-center">
            <p className="text-blue-800 dark:text-blue-300 text-sm mb-1">Recipient will receive</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">
              {quote.receiveAmount.toLocaleString()} {quote.receiveCurrency}
            </p>
          </div>

          {/* Terms */}
          <div className="mb-6">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5 shrink-0"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                I confirm that the information provided is accurate and I agree to the{' '}
                <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          {transferError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-300">{transferError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('quote')}
              disabled={isTransferring}
              className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleExecuteTransfer}
              disabled={isTransferring || !termsAccepted}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white disabled:text-slate-400 dark:disabled:text-slate-500 py-3 rounded-lg font-semibold transition flex items-center justify-center"
            >
              {isTransferring ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                `Send ${quote.sendAmount.toLocaleString()} ${quote.sendCurrency}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
