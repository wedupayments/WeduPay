/**
 * Wallets Page
 * 
 * Main wallet management page showing balances and quick actions.
 */

'use client';

import WalletBalanceCard from '@/components/wallet/WalletBalanceCard';
import Link from 'next/link';

export default function WalletsPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Wallets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your wallet balances and transactions</p>
        </div>
        <Link
          href="/dashboard/customer/wallets/fund"
          className="bg-primary text-background-dark px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition"
        >
          + Fund Wallet
        </Link>
      </div>

      {/* Balance Card */}
      <div className="mb-8">
        <WalletBalanceCard
          onFund={() => {}}
          onWithdraw={() => {}}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/customer/wallets/fund"
          className="p-6 bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-primary/10 shadow hover:shadow-lg transition"
        >
          <div className="text-3xl mb-3">💰</div>
          <h3 className="font-semibold text-lg mb-2">Fund Wallet</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Add funds from mobile money or card
          </p>
        </Link>

        <Link
          href="/dashboard/customer/cards"
          className="p-6 bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-primary/10 shadow hover:shadow-lg transition"
        >
          <div className="text-3xl mb-3">Cards</div>
          <h3 className="font-semibold text-lg mb-2">Virtual Cards</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Create and fund cards for secure online payments
          </p>
        </Link>

        <Link
          href="/dashboard/customer/wallets/withdraw"
          className="p-6 bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-primary/10 shadow hover:shadow-lg transition"
        >
          <div className="text-3xl mb-3">💸</div>
          <h3 className="font-semibold text-lg mb-2">Withdraw</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Transfer to mobile money or bank
          </p>
        </Link>

        <Link
          href="/dashboard/customer/wallets/history"
          className="p-6 bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-primary/10 shadow hover:shadow-lg transition"
        >
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-semibold text-lg mb-2">Transaction History</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            View all deposits and withdrawals
          </p>
        </Link>
      </div>
    </div>
  );
}
