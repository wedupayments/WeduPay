"use client";

import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { PaymentReferencesSection } from "@/components/dashboard/PaymentReferences";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { useCustomerDashboard } from "@/features/dashboard/hooks/useCustomerDashboard";
import Link from "next/link";

export default function CustomerDashboardPage() {
  const { data, isLoading: loading, error } = useCustomerDashboard();

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-red-500">error</span>
          <p className="text-slate-600 dark:text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 pb-20 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back, {data?.user?.name || "Customer"}
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

      <PaymentReferencesSection references={data?.references} />

      <TransactionTable transactions={data?.transactions} />

    </div>
  );
}
