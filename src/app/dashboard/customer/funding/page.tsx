"use client";

import { useState, useEffect } from "react";
import { MobileMoneyPayment, PaymentProvider } from "@/components/MobileMoneyPayment";
import { useToast } from "@/components/ui/Toast";

interface Wallet {
  id: string;
  walletType: string;
  currency: string;
  balance: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: PaymentProvider;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md">
        <MobileMoneyPayment
          amount={amount}
          provider={provider}
          onSuccess={handleSuccess}
          onError={handleError}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

export default function WalletFundingPage() {
  const toast = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const providers = [
    {
      id: "ecocash" as PaymentProvider,
      name: "EcoCash",
      icon: "eco",
      color: "bg-green-500",
      description: "Instant payment via EcoCash",
    },
    {
      id: "mpesa" as PaymentProvider,
      name: "M-Pesa",
      icon: "payments",
      color: "bg-yellow-600",
      description: "Safaricom M-Pesa",
    },
    {
      id: "mtn" as PaymentProvider,
      name: "MTN Money",
      icon: "signal_cellular_alt",
      color: "bg-yellow-400",
      description: "MTN Mobile Money",
    },
  ];

  useEffect(() => {
    fetch("/api/wallets")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setWallets(data.wallets || []);
        if (data.wallets?.length > 0) {
          setSelectedWallet(data.wallets[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Error", "Failed to load wallets");
        setLoading(false);
      });
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }

    if (amountNum > 100000) {
      toast.error("Amount Too Large", "Maximum amount is $100,000");
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedWallet || !selectedProvider) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId: selectedWallet, amount: parseFloat(amount), provider: selectedProvider })
      });
      if (!res.ok) throw new Error("Failed to fund on backend");
      
      toast.success("Payment Successful", `Successfully funded wallet with $${amount}`);
      setAmount("");
      setSelectedProvider(null);
      setShowPaymentModal(false);
      
      // Refresh wallets to show new balance
      const balanceRes = await fetch("/api/wallets");
      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setWallets(data.wallets || []);
      }
    } catch(err) {
      toast.error("Error", "Wallet funding failed. Please try again.");
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
      EcoCash: "eco",
      "M-Pesa": "payments",
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
                max="100000"
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
        provider={selectedProvider || "ecocash"}
        amount={parseFloat(amount) || 0}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
