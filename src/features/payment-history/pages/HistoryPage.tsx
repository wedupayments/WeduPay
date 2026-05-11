"use client";

import { useState, useEffect } from "react";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | "PROCESSING";
  type: string;
  description?: string | null;
  provider?: string | null;
  reference: string;
  sourceReference?: string | null;
  providerReference?: string | null;
  walletCredited?: boolean;
  createdAt: string;
}

function getStatusStyles(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-primary/20 text-primary border-primary/20";
    case "PENDING":
      return "bg-orange-500/20 text-orange-500 border-orange-500/20";
    case "PROCESSING":
      return "bg-blue-500/20 text-blue-500 border-blue-500/20";
    case "FAILED":
      return "bg-red-500/20 text-red-500 border-red-500/20";
    default:
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions?limit=50")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20 lg:pb-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">View your complete payment history</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <span className="material-symbols-outlined text-4xl sm:text-5xl text-primary animate-spin">progress_activity</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
          <div className="size-14 sm:size-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-primary/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl sm:text-4xl text-slate-400">history</span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-base sm:text-lg">No Transaction History</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            Your completed transactions will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider">
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold">Transaction</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden sm:table-cell">Date</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-right">Amount</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-none">{tx.description || tx.type.replaceAll("_", " ")}</span>
                        <span className="text-[10px] sm:text-xs text-slate-500 sm:hidden">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] sm:text-xs text-slate-500">{tx.reference}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          {tx.provider || "Manual"}
                          {tx.providerReference ? ` • Ref ${tx.providerReference}` : ""}
                          {tx.walletCredited ? " • Wallet credited" : tx.status === "PENDING" ? " • Awaiting confirmation" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-right text-slate-900 dark:text-white">${tx.amount.toFixed(2)} {tx.currency}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase border ${getStatusStyles(tx.status)}`}>
                        {tx.status.replaceAll("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
