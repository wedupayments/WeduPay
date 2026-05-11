"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MerchantDashboardData {
  user: {
    name: string;
    email: string;
  };
  stats: {
    totalRevenue: string;
    todayRevenue: string;
    completedPayments: number;
    pendingPayments: number;
    successRate: string;
    activeLinks: number;
  };
  recentPayments: Array<{
    id: string;
    reference: string;
    customer: string;
    amount: string;
    status: string;
    date: string;
  }>;
}

import { useAuthenticatedFetch } from "@/shared/hooks/useAuthenticatedFetch";

export default function MerchantDashboardPage() {
  const [data, setData] = useState<MerchantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetch: authFetch, isReady } = useAuthenticatedFetch();

  useEffect(() => {
    if (!isReady) return;

    authFetch("/api/dashboard/merchant")
      .then((response) => response.json())
      .then((payload) => {
        setData(payload);
      })
      .catch((err) => {
        console.error("Failed to fetch merchant dashboard:", err);
      })
      .finally(() => setLoading(false));
  }, [isReady, authFetch]);

  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl sm:text-6xl text-emerald-600 animate-spin">progress_activity</span>
          <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm sm:text-base">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back{data?.user?.name ? `, ${data.user.name}` : ""}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
            Here's what's happening with your business today
          </p>
        </div>
        <Link 
          href="/dashboard/merchant/payment-links"
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 shrink-0 text-sm sm:text-base"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">add</span>
          Create Payment Link
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard 
          label="Total Revenue" 
          value={data?.stats.totalRevenue || "$0.00"} 
          icon="payments"
        />
        <MetricCard 
          label="Today's Revenue" 
          value={data?.stats.todayRevenue || "$0.00"} 
          icon="today"
        />
        <MetricCard 
          label="Completed" 
          value={String(data?.stats.completedPayments || 0)} 
          icon="check_circle"
        />
        <MetricCard 
          label="Pending" 
          value={String(data?.stats.pendingPayments || 0)} 
          icon="pending"
        />
        <MetricCard 
          label="Success Rate" 
          value={data?.stats.successRate || "0%"} 
          icon="trending_up"
        />
        <MetricCard 
          label="Active Links" 
          value={String(data?.stats.activeLinks || 0)} 
          icon="link"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Accept Payment"
          description="Create a payment link"
          icon="add_card"
          href="/dashboard/merchant/payment-links"
          color="emerald"
        />
        <QuickActionCard
          title="View Payments"
          description="See all transactions"
          icon="receipt_long"
          href="/dashboard/merchant/payments"
          color="blue"
        />
        <QuickActionCard
          title="API Integration"
          description="Manage API keys"
          icon="integration_instructions"
          href="/dashboard/merchant/api-keys"
          color="purple"
        />
        <QuickActionCard
          title="Analytics"
          description="View detailed reports"
          icon="analytics"
          href="/dashboard/merchant/analytics"
          color="orange"
        />
      </div>

      {/* Recent Payments */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Payments</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Latest transactions from your customers</p>
          </div>
          <Link 
            href="/dashboard/merchant/payments"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View all
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {data?.recentPayments && data.recentPayments.length > 0 ? (
            data.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">person</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{payment.customer}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{payment.reference}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{payment.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{payment.amount}</p>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700">payments</span>
              <p className="text-slate-600 dark:text-slate-400 mt-3">No payments yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Create a payment link to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  icon, 
  trend, 
  trendUp 
}: { 
  label: string; 
  value: string; 
  icon: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">{icon}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  color
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}) {
  const colorClasses = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  }[color];

  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-all group"
    >
      <div className={`size-12 rounded-xl ${colorClasses} flex items-center justify-center mb-3`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    Verified: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Completed" },
    Pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Pending" },
    Processing: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Processing" },
    Failed: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Failed" },
  }[status] || { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-400", label: status };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
      {statusConfig.label}
    </span>
  );
}
