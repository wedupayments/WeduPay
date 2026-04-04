"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: string;
}

const typeOptions = ["ALL", "DEPOSIT", "WITHDRAWAL", "TRANSFER", "PAYMENT", "CARD_FUNDING"];

export default function WalletHistoryPage() {
  const toast = useToast();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (filter !== "ALL") {
          params.set("type", filter);
        }

        const response = await fetch(`/api/v1/wallets/history?${params.toString()}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load history");
        }

        setTransactions(data.transactions ?? []);
      } catch (error) {
        toast.error("Unable to load wallet history", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [filter, toast]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard/customer/wallets" className="text-primary hover:underline text-sm">
            Back to wallets
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Wallet history</h1>
          <p className="text-slate-600 dark:text-slate-400">Review deposits, withdrawals, transfers, and card funding activity.</p>
        </div>

        <div className="w-full sm:w-56">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Filter by type</label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All activity" : option.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            No wallet transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-primary/10">
              <thead className="bg-slate-50 dark:bg-primary/5">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="text-sm text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-4 font-medium">{transaction.type.replace("_", " ")}</td>
                    <td className="px-4 py-4">{transaction.reference}</td>
                    <td className="px-4 py-4">{new Date(transaction.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {transaction.amount.toFixed(2)} {transaction.currency}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
