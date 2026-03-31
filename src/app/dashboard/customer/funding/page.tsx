"use client";

import { useState, useEffect } from "react";
import { EcoCashPayment } from "@/components/EcoCashPayment";

interface Wallet {
  id: string;
  walletType: string;
  currency: string;
  balance: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: string;
  amount: number;
  onSuccess: () => void;
}

function PaymentModal({ isOpen, onClose, provider, amount, onSuccess }: PaymentModalProps) {
  if (!isOpen) return null;

  const handleSuccess = (transactionId: string) => {
    console.log("Payment successful:", transactionId);
    onSuccess();
    onClose();
  };

  const handleError = (error: string) => {
    console.error("Payment error:", error);
  };

  if (provider === "EcoCash") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-md">
          <EcoCashPayment
            amount={amount}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={onClose}
          />
        </div>
      </div>
    );
  }

  return null;
}

export default function WalletFundingPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const providers = [
    {
      id: "EcoCash",
      name: "EcoCash",
      icon: "phone_android",
      color: "bg-green-500",
      description: "Instant payment via EcoCash",
    },
    {
      id: "M-Pesa",
      name: "M-Pesa",
      icon: "phone_android",
      color: "bg-yellow-500",
      description: "Safaricom M-Pesa",
    },
    {
      id: "MTN",
      name: "MTN Money",
      icon: "signal_cellular_alt",
      color: "bg-yellow-400",
      description: "MTN Mobile Money",
    },
  ];

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
    if (!selectedProvider || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setSuccess(`Successfully funded wallet with $${amount}`);
    setAmount("");
    setSelectedProvider(null);
    setShowPaymentModal(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getWalletIcon = (type: string) => {
    const icons: Record<string, string> = {
      EcoCash: "phone_android",
      "M-Pesa": "phone_android",
      MTN: "signal_cellular_alt",
      default: "account_balance_wallet",
    };
    return icons[type] || icons.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-slate-600 dark:text-slate-400 mt-4">Loading wallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 lg:pb-8">
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
              Select Payment Provider
            </label>
            <div className="grid grid-cols-3 gap-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all ${
                    selectedProvider === provider.id
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`size-10 sm:size-12 mx-auto rounded-xl ${provider.color} flex items-center justify-center mb-2`}
                  >
                    <span className="material-symbols-outlined text-white text-lg sm:text-xl">
                      {provider.icon}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {provider.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
              Select Wallet (Optional)
            </label>
            <div className="grid grid-cols-1 gap-3">
              {wallets.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <span className="material-symbols-outlined text-4xl sm:text-5xl text-slate-300 dark:text-slate-600">
                    account_balance_wallet
                  </span>
                  <p className="text-slate-500 mt-3 text-sm sm:text-base">
                    No wallets found
                  </p>
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
          <span className="material-symbols-outlined text-primary shrink-0 text-lg sm:text-xl">
            info
          </span>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Funds are transferred instantly via mobile money. Select a provider above and enter
            the amount to initiate payment.
          </p>
        </div>

        <button
          type="submit"
          disabled={!selectedProvider || !amount || submitting}
          className="w-full py-3 sm:py-4 bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm sm:text-base"
        >
          <span className="material-symbols-outlined">payments</span>
          {submitting ? "Processing..." : "Continue to Payment"}
        </button>
      </form>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        provider={selectedProvider || ""}
        amount={parseFloat(amount) || 0}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
