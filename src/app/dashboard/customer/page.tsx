"use client";

import { CustomerLayout } from "@/components/dashboard/CustomerLayout";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { PaymentReferencesSection } from "@/components/dashboard/PaymentReferences";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  stats: {
    pendingApprovals: number;
    verifiedThisSemester: string;
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
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
            <p className="text-slate-600 dark:text-slate-400 mt-4">Loading dashboard...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout 
      userName={data?.user?.name || "Student"} 
      userId={data?.user?.userId || "00000"}
    >
      <div className="max-w-6xl mx-auto w-full space-y-8 pb-20 lg:pb-0">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back, {data?.user?.name || "Student"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Ready to manage your education payments?
            </p>
          </div>
          <Link 
            href="/dashboard/customer/funding"
            className="flex items-center justify-center gap-2 bg-primary hover:brightness-110 text-background-dark px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 shrink-0"
          >
            <span className="material-symbols-outlined">add</span>
            Fund Wallet
          </Link>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={data?.stats} />

        {/* Active References Section */}
        <PaymentReferencesSection references={data?.references} />

        {/* Transactions Table */}
        <TransactionTable transactions={data?.transactions} />

        {/* Security Tip */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-xl text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <h4 className="font-bold text-primary">Secure Payment System</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              WeduPay uses end-to-end encryption for all institutional transfers. 
              Your payments are verified directly with the institution within 24-48 business hours.
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
