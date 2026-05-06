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
  
  // Saved recipients
  const [savedRecipients, setSavedRecipients] = useState<Recipient[]>([]);
  const [showRecipients, setShowRecipients] = useState<boolean>(false);

  // Load saved recipients
  useEffect(() => {
    loadRecipients();
  }, []);

  // Auto-fetch quote when amount or country changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sendAmount > 0 && recipientCountry) {
        fetchQuote();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [sendAmount, recipientCountry, sendCurrency]);

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
    } catch (error) {
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
        // Navigate to success page
        router.push(`/dashboard/customer/transfers/success?id=${data.transfer.reference}`);
      } else {
        setTransferError(data.error || 'Transfer failed. Please try again.');
        setStep('confirm');
      }
    } catch (error) {
      setTransferError('Network error. Please try again.');
      setStep('confirm');
    } finally {
      setIsTransferring(false);
    }
  };

  const getCountryByCode = (code: string) => COUNTRIES.find(c => c.code === code);
  const getSendCountry = () => getCountryByCode('KE'); // Default sender country (would be from user profile)
  const getRecipientCountry = () => getCountryByCode(recipientCountry);
  const recipientCurrency = getRecipientCountry()?.currency || 'USD';

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Send Money Abroad</h1>
        <p className="text-gray-600">Transfer money directly to mobile wallets across Africa</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Details', 'Quote', 'Confirm'].map((label, index) => {
            const isActive = 
              (step === 'form' && index === 0) ||
              (step === 'quote' && index === 1) ||
              (step === 'confirm' && index === 2);
            
            return (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  isActive
                    ? 'font-semibold'
                    : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {index < 2 && <div className="w-16 h-0.5 bg-gray-200 mx-4" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Transfer Form */}
      {step === 'form' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Transfer Details</h2>

          {/* Send Amount */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium">Amount to Send</label>
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
                min="1"
              />
              <select
                value={sendCurrency}
                onChange={(e) => setSendCurrency(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="KES">KES 🇰🇪</option>
                <option value="USD">USD 🇺🇸</option>
                <option value="EUR">EUR 🇪🇺</option>
                <option value="GBP">GBP 🇬🇧</option>
              </select>
            </div>
          </div>

          {/* Recipient Country */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Recipient Country</label>
            <select
              value={recipientCountry}
              onChange={(e) => setRecipientCountry(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name} ({country.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Phone */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Recipient Phone Number
              <button
                type="button"
                onClick={() => setShowRecipients(!showRecipients)}
                className="ml-2 text-sm text-blue-600 hover:underline"
              >
                Choose from saved
              </button>
            </label>
            
            {showRecipients && savedRecipients.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Saved Recipients:</p>
                {savedRecipients.map((recipient) => (
                  <button
                    key={recipient.id}
                    onClick={() => selectRecipient(recipient)}
                    className="w-full text-left p-2 hover:bg-white rounded cursor-pointer transition"
                  >
                    <span className="font-medium">{recipient.name}</span>
                    <span className="text-gray-600 ml-2">{recipient.phoneNumber}</span>
                    <span className="text-gray-500 ml-2">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 255712345678"
            />
            <p className="mt-1 text-sm text-gray-500">Include country code (e.g., 255 for Tanzania)</p>
          </div>

          {/* Recipient Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Recipient Name</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Full name"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Family support, Business payment"
            />
          </div>

          {/* Save Recipient Checkbox */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={saveRecipient}
                onChange={(e) => setSaveRecipient(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Save this recipient for future transfers</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => {
              fetchQuote();
              setStep('quote');
            }}
            disabled={!sendAmount || !recipientPhone || !recipientCountry}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Get Quote
          </button>
        </div>
      )}

      {/* Step 2: Quote Display */}
      {step === 'quote' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Transfer Quote</h2>

          {isLoadingQuote ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Getting best exchange rate...</p>
            </div>
          ) : quoteError ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">⚠️</div>
              <p className="text-red-600">{quoteError}</p>
              <button
                onClick={() => setStep('form')}
                className="mt-4 text-blue-600 hover:underline"
              >
                Go Back
              </button>
            </div>
          ) : quote ? (
            <>
              {/* Exchange Rate Card */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-6">
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
                <div className="border-t border-blue-400 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Exchange Rate</span>
                    <span className="font-semibold">1 {quote.sendCurrency} = {quote.exchangeRate.toFixed(2)} {quote.receiveCurrency}</span>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">Fee Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Fee</span>
                    <span>{quote.fees.transferFee.toLocaleString()} {quote.sendCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">FX Fee (included in rate)</span>
                    <span>{quote.fees.fxFee.toLocaleString()} {quote.sendCurrency}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Fees</span>
                    <span>{quote.fees.totalFees.toLocaleString()} {quote.sendCurrency}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total to Debit</span>
                    <span>{quote.totalDebit.toLocaleString()} {quote.sendCurrency}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚡</span>
                  <div>
                    <p className="font-semibold text-green-800">{quote.estimatedDelivery}</p>
                    <p className="text-sm text-green-600">via {quote.route.provider}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Continue
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && quote && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Confirm Transfer</h2>

          {/* Transfer Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Transfer Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">{quote.sendAmount.toLocaleString()} {quote.sendCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient</span>
                <span className="font-medium">{recipientName || recipientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Country</span>
                <span className="font-medium">
                  {getRecipientCountry()?.flag} {getRecipientCountry()?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium">{recipientPhone}</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Description</span>
                  <span className="font-medium">{description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-blue-800 text-sm mb-1">Recipient will receive</p>
              <p className="text-3xl font-bold text-blue-900">
                {quote.receiveAmount.toLocaleString()} {quote.receiveCurrency}
              </p>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
              />
              <span className="ml-2 text-sm text-gray-600">
                I confirm that the information provided is accurate and I agree to the{' '}
                <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          {/* Error Display */}
          {transferError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{transferError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('quote')}
              disabled={isTransferring}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleExecuteTransfer}
              disabled={isTransferring}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center"
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
