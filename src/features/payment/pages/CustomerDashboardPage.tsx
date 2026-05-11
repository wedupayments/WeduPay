"use client";

import { useState, useEffect } from "react";
import { StatsGrid } from "@/features/payment/components/StatsGrid";
import { PaymentReferencesSection } from "@/features/payment/components/PaymentReferences";
import { TransactionTable } from "@/features/payment-history/components/TransactionTable";
import { FXSnapshot } from "@/features/fx/components/FXSnapshot";
import Link from "next/link";

interface DashboardData {
  stats: {
    pendingApprovals: number;
    totalSpent: string;
    primaryMerchant: string;
  };
  references: Array<{
    id: string;
    title: string;
    ref: string;
    icon: string;
  }>;
  transactions: Array<{
    id: string;
    merchant: string;
    purpose: string;
    term: string;
    date: string;
    amount: string;
    status: "Verified" | "Pending" | "Processing" | "Failed";
    detail?: string | null;
  }>;
  user: {
    name: string;
    userId: string;
    email: string;
  };
}

export default function CustomerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/customer")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl sm:text-6xl text-primary animate-spin">progress_activity</span>
          <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm sm:text-base">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 pb-20 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back{data?.user?.name ? `, ${data.user.name}` : ""}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
            Ready to manage your payments?
          </p>
        </div>
        <Link 
          href="/dashboard/customer/funding"
          className="flex items-center justify-center gap-2 bg-primary hover:brightness-110 text-background-dark px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 shrink-0 text-sm sm:text-base"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">add</span>
          Fund Wallet
        </Link>
      </div>

      <StatsGrid stats={data?.stats} />

      <FXSnapshot />

      <PaymentReferencesSection references={data?.references} />

      <TransactionTable transactions={data?.transactions} />

    </div>
  );
}
