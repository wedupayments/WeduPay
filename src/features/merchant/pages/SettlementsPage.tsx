"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface Settlement {
  id: string;
  amount: number;
  currency: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  bankAccount: string | null;
}

interface Balance {
  availableBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  currency: string;
}

import { useAuthenticatedFetch } from "@/shared/hooks/useAuthenticatedFetch";

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const { fetch: authFetch, isReady } = useAuthenticatedFetch();

  const fetchData = async () => {
    if (!isReady) return;
    try {
      setLoading(true);
      const [balRes, setRes] = await Promise.all([
        authFetch("/api/v1/settlements/balance"),
        authFetch("/api/v1/settlements")
      ]);

      const balData = await balRes.json();
      const setData = await setRes.json();

      if (balData.success) setBalance(balData.balance);
      if (setData.success) setSettlements(setData.settlements || []);
    } catch (err) {
      console.error("Settlement fetch error:", err);
      toast.error("Failed to load settlement data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isReady, authFetch]);

  const handleRequestPayout = async () => {
    if (!balance || balance.availableBalance <= 0) {
      toast.error("Low balance to request payout");
      return;
    }

    try {
      setRequesting(true);
      const res = await authFetch("/api/v1/settlements/request-payout", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payout request submitted!");
        fetchData();
      } else {
        toast.error(data.error || "Failed to submit request");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
     return <div className="p-12 text-center animate-pulse">Loading settlements...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-white">
      <div>
        <h1 className="text-2xl font-bold">Settlements</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Track your payment settlements and payouts</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400">Available Balance</p>
          <p className="text-3xl font-bold mt-2">
            {balance?.availableBalance.toLocaleString()} <span className="text-lg">{balance?.currency}</span>
          </p>
          <button 
            onClick={handleRequestPayout}
            disabled={requesting || (balance?.availableBalance || 0) <= 0}
            className="mt-4 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {requesting ? "Processing..." : "Request Payout"}
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400">Pending Settlement</p>
          <p className="text-3xl font-bold mt-2">
            {balance?.pendingBalance.toLocaleString()} <span className="text-lg">{balance?.currency}</span>
          </p>
          <p className="text-sm text-slate-500 mt-2">Transactions uncleared</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
          <p className="text-3xl font-bold mt-2">
            {balance?.totalRevenue.toLocaleString()} <span className="text-lg">{balance?.currency}</span>
          </p>
          <p className="text-sm text-emerald-600 mt-2">Historical earnings</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">Settlement History</h2>
          <span className="text-xs text-slate-500">{settlements.length} total entries</span>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {settlements.length > 0 ? (
            settlements.map((settlement) => (
              <div key={settlement.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{new Date(settlement.requestedAt).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      ID: {settlement.id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">+{settlement.amount.toLocaleString()} {settlement.currency}</p>
                      <p className="text-xs text-slate-500">
                        {settlement.processedAt ? `Processed on ${new Date(settlement.processedAt).toLocaleDateString()}` : "Awaiting processing"}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      settlement.status === "COMPLETED"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : settlement.status === "FAILED"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    }`}>
                      {settlement.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
                No settlement history found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
