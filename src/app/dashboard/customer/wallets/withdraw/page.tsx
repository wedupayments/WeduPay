"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface WalletBalance {
  walletId: string;
  currency: string;
  balance: number;
  availableBalance: number;
}

export default function WithdrawWalletPage() {
  const router = useRouter();
  const toast = useToast();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [walletId, setWalletId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState<"mobile_money" | "bank_account">("mobile_money");
  const [destinationPhone, setDestinationPhone] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadWallets = async () => {
      try {
        const response = await fetch("/api/v1/wallets/balance?all=true");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load wallets");
        }

        setWallets(data.balances ?? []);
        if (data.balances?.length) {
          setWalletId(data.balances[0].walletId);
          setCurrency(data.balances[0].currency);
        }
      } catch (error) {
        toast.error("Unable to load wallets", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadWallets();
  }, [toast]);

  const selectedWallet = wallets.find((wallet) => wallet.walletId === walletId);

  const handleWalletChange = (nextWalletId: string) => {
    const nextWallet = wallets.find((wallet) => wallet.walletId === nextWalletId);
    setWalletId(nextWalletId);
    setCurrency(nextWallet?.currency ?? "USD");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(amount);
    if (!walletId || !parsedAmount || parsedAmount <= 0) {
      toast.error("Invalid withdrawal", "Choose a wallet and enter a valid amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/wallets/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId,
          currency,
          amount: parsedAmount,
          destination,
          destinationPhone: destination === "mobile_money" ? destinationPhone : undefined,
          destinationAccount: destination === "bank_account" ? destinationAccount : undefined,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Withdrawal failed");
      }

      toast.success("Withdrawal submitted", data.message || "Your withdrawal was processed.");
      router.push("/dashboard/customer/wallets");
      router.refresh();
    } catch (error) {
      toast.error("Withdrawal failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/customer/wallets" className="text-primary hover:underline text-sm">
          Back to wallets
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Withdraw funds</h1>
        <p className="text-slate-600 dark:text-slate-400">Move money from your WeduPay wallet to mobile money or a bank account.</p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Wallet</label>
            <select
              value={walletId}
              onChange={(event) => handleWalletChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
            >
              {wallets.map((wallet) => (
                <option key={wallet.walletId} value={wallet.walletId}>
                  {wallet.currency} wallet • Available {wallet.availableBalance.toFixed(2)}
                </option>
              ))}
            </select>
            {selectedWallet ? (
              <p className="mt-2 text-sm text-slate-500">Available balance: {selectedWallet.availableBalance.toFixed(2)} {selectedWallet.currency}</p>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Destination</label>
              <select
                value={destination}
                onChange={(event) => setDestination(event.target.value as "mobile_money" | "bank_account")}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
              >
                <option value="mobile_money">Mobile money</option>
                <option value="bank_account">Bank account</option>
              </select>
            </div>
          </div>

          {destination === "mobile_money" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile money number</label>
              <input
                type="tel"
                value={destinationPhone}
                onChange={(event) => setDestinationPhone(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                placeholder="+263771234567"
              />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Bank account number</label>
              <input
                type="text"
                value={destinationAccount}
                onChange={(event) => setDestinationAccount(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                placeholder="Account number"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
              placeholder="Optional note for this withdrawal"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !walletId}
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Processing withdrawal..." : "Withdraw funds"}
          </button>
        </form>
      )}
    </div>
  );
}
