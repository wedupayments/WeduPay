"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MerchantDashboardData {
  user: {
    name: string;
    email: string;
  };
  stats: {
    totalReceived: string;
    completedPayments: number;
    pendingSettlements: number;
    activeWallets: number;
  };
  recentPayments: Array<{
    id: string;
    reference: string;
    amount: string;
    status: string;
    date: string;
  }>;
}

export default function MerchantDashboardPage() {
  const [data, setData] = useState<MerchantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/customer")
      .then((response) => response.json())
      .then((payload) => {
        const completed = payload.transactions?.filter((tx: { status: string }) => tx.status === "Verified") ?? [];
        const pending = payload.transactions?.filter((tx: { status: string }) => tx.status === "Pending") ?? [];

        setData({
          user: payload.user,
          stats: {
            totalReceived: completed.reduce((sum: number, tx: { amount: string }) => sum + Number(tx.amount.replace(/[^0-9.]/g, "")), 0).toLocaleString("en-US", { style: "currency", currency: "USD" }),
            completedPayments: completed.length,
            pendingSettlements: pending.length,
            activeWallets: payload.wallets?.length ?? 0,
          },
          recentPayments: payload.transactions ?? [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Merchant Dashboard
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Welcome back, {data?.user?.name || "Merchant"}.
          </p>
        </div>

        <Link
          href="/dashboard/customer/history"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          View payment history
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Received" value={data?.stats.totalReceived || "$0.00"} />
        <MetricCard label="Completed Payments" value={String(data?.stats.completedPayments || 0)} />
        <MetricCard label="Pending Settlements" value={String(data?.stats.pendingSettlements || 0)} />
        <MetricCard label="Active Wallets" value={String(data?.stats.activeWallets || 0)} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Merchant Payments</h2>
        <div className="mt-4 space-y-3">
          {data?.recentPayments?.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{payment.reference}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{payment.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900 dark:text-white">{payment.amount}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{payment.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
