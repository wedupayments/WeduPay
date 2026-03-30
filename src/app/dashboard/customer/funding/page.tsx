"use client";

import { useState, useEffect } from "react";
import { CustomerLayout } from "@/components/dashboard/CustomerLayout";

interface Wallet {
  id: string;
  walletType: string;
  currency: string;
  balance: number;
}

export default function WalletFundingPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/wallets")
      .then((res) => res.json())
      .then((data) => {
        setWallets(data.wallets || []);
        if (data.wallets?.length > 0) {
          setSelectedWallet(data.wallets[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load wallets");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet || !amount) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "current-user",
          walletType: selectedWallet,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSuccess(`Successfully funded wallet with $${amount}`);
      setAmount("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Funding failed");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getWalletIcon = (type: string) => {
    const icons: Record<string, string> = {
      "EcoCash": "phone_android",
      "M-Pesa": "phone_android",
      "MTN": "signal_cellular_alt",
      "Airtel": "signal_cellular_alt",
      "default": "account_balance_wallet"
    };
    return icons[type] || icons.default;
  };

  if (loading) {
    return (
      <CustomerLayout title="Fund Wallet">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            <p className="text-slate-600 dark:text-slate-400 mt-4">Loading wallets...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="Fund Wallet">
      <div className="max-w-xl mx-auto space-y-6 pb-20 lg:pb-0">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
            Fund Your Wallet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Add funds to your connected mobile wallets instantly
          </p>
        </div>

        {error && (
          <div className="p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center gap-2 sm:gap-3 text-sm">
            <span className="material-symbols-outlined shrink-0">error</span>
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center gap-2 sm:gap-3 text-sm">
            <span className="material-symbols-outlined shrink-0">check_circle</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-background-dark rounded-xl sm:rounded-2xl border border-slate-200 dark:border-primary/10 p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
                Select Wallet
              </label>
              <div className="grid grid-cols-1 gap-3">
                {wallets.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <span className="material-symbols-outlined text-4xl sm:text-5xl text-slate-300 dark:text-slate-600">account_balance_wallet</span>
                    <p className="text-slate-500 mt-3 text-sm sm:text-base">No wallets found</p>
                  </div>
                ) : (
                  wallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      onClick={() => setSelectedWallet(wallet.id)}
                      className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                        selectedWallet === wallet.id
                          ? "border-primary bg-primary/10"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 sm:size-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-lg sm:text-xl">
                            {getWalletIcon(wallet.walletType)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate text-sm sm:text-base">
                            {wallet.walletType}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatCurrency(wallet.balance, wallet.currency)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Amount to Fund
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base sm:text-lg">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-background-dark text-slate-900 dark:text-white text-base sm:text-lg font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 mt-3">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-primary/20 transition-colors"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-primary/5 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <span className="material-symbols-outlined text-primary shrink-0 text-lg sm:text-xl">info</span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Funds are transferred instantly via mobile money. Supported providers
              include EcoCash, M-Pesa, MTN Mobile Money, and Airtel Money.
            </p>
          </div>

          <button
            type="submit"
            disabled={!selectedWallet || !amount || submitting}
            className="w-full py-3 sm:py-4 bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm sm:text-base"
          >
            <span className="material-symbols-outlined">payments</span>
            {submitting ? "Processing..." : "Fund Wallet"}
          </button>
        </form>
      </div>
    </CustomerLayout>
  );
}
