/**
 * Fund Wallet Form Component
 * 
 * Allows users to deposit funds into their wallet from various payment sources.
 * Supports multiple payment methods and currencies.
 * 
 * Features:
 * - Payment method selection (M-Pesa, Airtel, MTN, etc.)
 * - Currency selection
 * - Amount input with validation
 * - Real-time fee calculation
 * - Transaction confirmation
 * 
 * @component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FundWalletFormProps {
  userId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  currencies: string[];
  minAmount: number;
  maxAmount: number;
  fee: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: '📱',
    currencies: ['KES', 'USD'],
    minAmount: 10,
    maxAmount: 150000,
    fee: 0, // Free deposits
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    icon: '📱',
    currencies: ['KES', 'UGX', 'ZMW'],
    minAmount: 10,
    maxAmount: 100000,
    fee: 0,
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    icon: '📱',
    currencies: ['UGX', 'GHS', 'XOF'],
    minAmount: 1000,
    maxAmount: 5000000,
    fee: 0,
  },
  {
    id: 'flutterwave',
    name: 'Card/Bank',
    icon: '💳',
    currencies: ['NGN', 'GHS', 'KES', 'USD'],
    minAmount: 100,
    maxAmount: 1000000,
    fee: 1.5, // 1.5% fee
  },
];

export default function FundWalletForm({
  userId,
  onSuccess,
  onCancel,
}: FundWalletFormProps) {
  const router = useRouter();
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState<string>('mpesa');
  const [currency, setCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<number | ''>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  // Get selected payment method details
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);

  /**
   * Calculate fees for the deposit
   */
  const calculateFees = () => {
    if (!amount || !selectedMethod) return 0;
    return (amount as number) * (selectedMethod.fee / 100);
  };

  /**
   * Calculate total amount (including fees)
   */
  const calculateTotal = () => {
    if (!amount) return 0;
    return (amount as number) + calculateFees();
  };

  /**
   * Handle payment method selection
   */
  const handleMethodSelect = (methodId: string) => {
    setPaymentMethod(methodId);
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    if (method && method.currencies.length > 0) {
      setCurrency(method.currencies[0]);
    }
  };

  /**
   * Validate form before submission
   */
  const validateForm = (): string | null => {
    if (!amount || amount <= 0) {
      return 'Please enter a valid amount';
    }

    if (!selectedMethod) {
      return 'Please select a payment method';
    }

    if (amount < selectedMethod.minAmount) {
      return `Minimum amount is ${selectedMethod.minAmount} ${currency}`;
    }

    if (amount > selectedMethod.maxAmount) {
      return `Maximum amount is ${selectedMethod.maxAmount} ${currency}`;
    }

    if (paymentMethod.startsWith('mpesa') || paymentMethod.startsWith('airtel') || paymentMethod.startsWith('mtn')) {
      if (!phoneNumber || phoneNumber.length < 10) {
        return 'Please enter a valid phone number';
      }
    }

    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call fund wallet API
      const response = await fetch('/api/v1/wallets/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || 'user-123',
        },
        body: JSON.stringify({
          currency,
          amount: Number(amount),
          source: paymentMethod === 'flutterwave' ? 'card' : 'mobile_money',
          sourceReference: `PENDING-${Date.now()}`,
          description: `Deposit via ${selectedMethod?.name}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Success - redirect or show success message
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard/customer/wallets?success=funded');
        }
      } else {
        setError(result.error || 'Failed to fund wallet');
      }
    } catch (err) {
      console.error('Fund wallet error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Fund Your Wallet
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleMethodSelect(method.id)}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    paymentMethod === method.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{method.icon}</span>
                  <p className="font-medium text-gray-900 dark:text-white">{method.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {method.fee === 0 ? 'Free' : `${method.fee}% fee`}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {selectedMethod?.currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                min={selectedMethod?.minAmount}
                max={selectedMethod?.maxAmount}
                step="0.01"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {currency}
              </span>
            </div>
            {selectedMethod && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Min: {selectedMethod.minAmount} {currency} • Max: {selectedMethod.maxAmount} {currency}
              </p>
            )}
          </div>

          {/* Phone Number (for mobile money) */}
          {(paymentMethod === 'mpesa' || paymentMethod === 'airtel' || paymentMethod === 'mtn') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 254712345678"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You'll receive a prompt on this number to confirm payment
              </p>
            </div>
          )}

          {/* Fee Summary */}
          {amount && amount > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Amount</span>
                  <span>{Number(amount).toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Fees ({selectedMethod?.fee}%)</span>
                  <span>{calculateFees().toFixed(2)} {currency}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-semibold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{calculateTotal().toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={isLoading || !amount}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Processing...
                </span>
              ) : (
                `Deposit ${calculateTotal() > 0 ? calculateTotal().toFixed(2) : ''} ${currency}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
