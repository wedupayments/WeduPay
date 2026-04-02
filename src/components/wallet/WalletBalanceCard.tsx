/**
 * Wallet Balance Card Component
 * 
 * Displays user's wallet balance with multi-currency support.
 * Shows available balance, pending balance, and total in USD.
 * 
 * Features:
 * - Multi-currency display
 * - Available vs pending balance
 * - Total balance in USD
 * - Quick actions (fund, withdraw)
 * - Loading states
 * 
 * @component
 * 
 * @example
 * ```tsx
 * <WalletBalanceCard
 *   userId="user-123"
 *   onFund={() => router.push('/dashboard/customer/wallets/fund')}
 *   onWithdraw={() => router.push('/dashboard/customer/wallets/withdraw')}
 * />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WalletBalance {
  walletId: string;
  currency: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
}

interface WalletBalanceCardProps {
  userId?: string;
  onFund?: () => void;
  onWithdraw?: () => void;
  compact?: boolean;
}

export default function WalletBalanceCard({
  userId,
  onFund,
  onWithdraw,
  compact = false,
}: WalletBalanceCardProps) {
  const router = useRouter();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [totalUSD, setTotalUSD] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load wallet balances on mount
   */
  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/v1/wallets/balance?all=true', {
        headers: {
          'x-user-id': userId || 'user-123',
        },
      });

      const data = await response.json();

      if (data.success) {
        setBalances(data.balances);
        setTotalUSD(data.totalUSD);
      } else {
        setError(data.error || 'Failed to load balances');
      }
    } catch (err) {
      console.error('Load balances error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format currency amount
   */
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  /**
   * Get currency flag emoji
   */
  const getCurrencyFlag = (currency: string) => {
    const flags: Record<string, string> = {
      USD: '🇺🇸',
      KES: '🇰🇪',
      TZS: '🇹🇿',
      UGX: '🇺🇬',
      NGN: '🇳🇬',
      GHS: '🇬🇭',
      XOF: '🇸🇳',
      ZAR: '🇿🇦',
      ZMW: '🇿🇲',
      MZN: '🇲🇿',
    };
    return flags[currency] || '💰';
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow p-6 ${compact ? '' : 'min-h-[200px]'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadBalances}
            className="text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Wallet Balances
        </h2>
        {!compact && (
          <div className="flex gap-2">
            <button
              onClick={onFund || (() => router.push('/dashboard/customer/wallets/fund'))}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Fund
            </button>
            <button
              onClick={onWithdraw || (() => router.push('/dashboard/customer/wallets/withdraw'))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Withdraw
            </button>
          </div>
        )}
      </div>

      {/* Total Balance in USD */}
      {!compact && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
          <p className="text-blue-100 text-sm mb-1">Total Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(totalUSD, 'USD')}</p>
        </div>
      )}

      {/* Individual Wallet Balances */}
      {balances.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <span className="text-4xl mb-2 block">💸</span>
          <p>No wallets yet</p>
          <button
            onClick={onFund || (() => router.push('/dashboard/customer/wallets/fund'))}
            className="mt-2 text-blue-600 hover:underline"
          >
            Fund your first wallet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {balances.map((wallet) => (
            <div
              key={wallet.walletId}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getCurrencyFlag(wallet.currency)}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {wallet.currency}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(wallet.balance, wallet.currency)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Available: {formatCurrency(wallet.availableBalance, wallet.currency)}</span>
                {wallet.pendingBalance > 0 && (
                  <span>Pending: {formatCurrency(wallet.pendingBalance, wallet.currency)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
