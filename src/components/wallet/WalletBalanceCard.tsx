'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletBalance {
  id: string;
  walletId?: string;
  currency: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  walletType: string;
  nickname?: string;
}

interface WalletBalanceCardProps {
  userId?: string;
  onFund?: () => void;
  onWithdraw?: () => void;
  compact?: boolean;
}

// ─── Brand config ─────────────────────────────────────────────────────────────

const WALLET_BRANDS: Record<
  string,
  { gradient: string; accent: string; textLight: string; logo: string; border: string }
> = {
  mpesa: {
    gradient: 'linear-gradient(135deg, #1a7c3e 0%, #43a047 60%, #66bb6a 100%)',
    accent: '#1a7c3e',
    textLight: '#c8f7d8',
    logo: '/logos/mpesa.png',
    border: 'rgba(67,160,71,0.35)',
  },
  ecocash: {
    gradient: 'linear-gradient(135deg, #b71c1c 0%, #e53935 60%, #ef5350 100%)',
    accent: '#b71c1c',
    textLight: '#ffd0ce',
    logo: '/logos/ecocash.png',
    border: 'rgba(229,57,53,0.35)',
  },
  mtn: {
    gradient: 'linear-gradient(135deg, #b7840c 0%, #f9a825 60%, #ffd54f 100%)',
    accent: '#795548',
    textLight: '#fff8e1',
    logo: '/logos/mtn-momo.png',
    border: 'rgba(249,168,37,0.45)',
  },
};

const FALLBACK_BRAND = {
  gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 60%, #4a90d9 100%)',
  accent: '#1e3a5f',
  textLight: '#cce3f8',
  logo: null as null | string,
  border: 'rgba(74,144,217,0.35)',
};

function getBrand(walletType: string) {
  return WALLET_BRANDS[walletType.toLowerCase()] ?? FALLBACK_BRAND;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

// ─── Component ────────────────────────────────────────────────────────────────

export default function WalletBalanceCard({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
  onFund,
  onWithdraw,
  compact = false,
}: WalletBalanceCardProps) {
  const router = useRouter();
  const { isInitialized, isLoading: authLoading, session } = useAuth();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [totalUSD, setTotalUSD] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!isInitialized || authLoading || !session) return;
    loadBalances();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, authLoading, session]);

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/v1/wallets/balance?all=true', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setBalances(data.balances);
        setTotalUSD(data.totalUSD);
      } else {
        setError(data.error || 'Failed to load balances');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRename = (wallet: WalletBalance) => {
    const id = wallet.id ?? wallet.walletId ?? '';
    setRenamingId(id);
    setRenameValue(wallet.nickname || '');
  };

  const commitRename = async (walletId: string) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: renameValue }),
      });
      if (!response.ok) throw new Error();
      await loadBalances();
    } catch {
      // swallow – leave rename open so user can retry
    } finally {
      setRenamingId(null);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 ${compact ? '' : 'min-h-[220px]'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button onClick={loadBalances} className="text-blue-600 hover:underline">Try Again</button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Wallet Balances</h2>
        {!compact && (
          <div className="flex gap-2">
            <button
              onClick={onFund || (() => router.push('/dashboard/customer/wallets/fund'))}
              className="px-4 py-2 bg-primary text-background-dark text-sm rounded-lg hover:brightness-110 transition font-medium"
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

      {/* Total balance hero */}
      {!compact && (
        <div
          className="mb-6 p-5 rounded-xl text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 60%, #4a90d9 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-8 -left-4 w-36 h-36 rounded-full opacity-10 bg-white" />
          <p className="text-blue-100 text-xs uppercase tracking-widest mb-1 font-medium relative z-10">Total across all wallets</p>
          <p className="text-3xl font-bold relative z-10">{fmt(totalUSD, 'USD')}</p>
        </div>
      )}

      {/* Per-wallet branded cards */}
      {balances.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
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
        <div className="space-y-4">
          {balances.map((wallet) => {
            const brand = getBrand(wallet.walletType);
            const walletId = wallet.id ?? wallet.walletId ?? '';
            const isRenaming = renamingId === walletId;
            const displayName =
              wallet.nickname ||
              wallet.walletType.charAt(0).toUpperCase() + wallet.walletType.slice(1);

            return (
              <div
                key={walletId}
                className="relative overflow-hidden rounded-2xl text-white shadow-md"
                style={{ background: brand.gradient, border: `1.5px solid ${brand.border}` }}
              >
                {/* Background decorations */}
                <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-[0.12] bg-white pointer-events-none" />
                <div className="absolute -bottom-10 -left-6 w-44 h-44 rounded-full opacity-[0.09] bg-white pointer-events-none" />

                <div className="relative z-10 p-5">
                  {/* Top row: logo + name */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {brand.logo ? (
                        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm p-1 flex items-center justify-center shadow-inner">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={brand.logo} alt={wallet.walletType} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl">💰</div>
                      )}
                      <div>
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(walletId); if (e.key === 'Escape') setRenamingId(null); }}
                            onBlur={() => commitRename(walletId)}
                            className="bg-white/20 border border-white/40 rounded-md px-2 py-0.5 text-white text-sm font-semibold w-40 outline-none placeholder:text-white/60"
                            placeholder="Wallet nickname…"
                          />
                        ) : (
                          <button
                            onClick={() => startRename(wallet)}
                            className="group flex items-center gap-1 text-left"
                            title="Click to rename"
                          >
                            <span className="text-sm font-bold text-white drop-shadow-sm">{displayName}</span>
                            <svg
                              className="w-3 h-3 opacity-0 group-hover:opacity-80 transition text-white/80"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                            </svg>
                          </button>
                        )}
                        <span className="text-[11px] font-medium" style={{ color: brand.textLight }}>
                          {wallet.currency}
                        </span>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="text-right">
                      <p className="text-xl font-bold drop-shadow-sm">{fmt(wallet.balance, wallet.currency)}</p>
                      {wallet.pendingBalance > 0 && (
                        <p className="text-[11px]" style={{ color: brand.textLight }}>
                          Pending: {fmt(wallet.pendingBalance, wallet.currency)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: available */}
                  <div className="flex items-center justify-between border-t border-white/20 pt-3 mt-1">
                    <span className="text-[11px]" style={{ color: brand.textLight }}>
                      Available
                    </span>
                    <span className="text-sm font-semibold">
                      {fmt(wallet.availableBalance, wallet.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
