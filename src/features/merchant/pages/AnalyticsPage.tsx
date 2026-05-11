"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface AnalyticsData {
  revenue: Array<{ date: string; amount: number }>;
  paymentMethods: Array<{ method: string; count: number; amount: number }>;
  geography: Array<{ country: string; count: number; amount: number }>;
  successRate: Array<{ date: string; rate: number }>;
}

import { useAuthenticatedFetch } from "@/shared/hooks/useAuthenticatedFetch";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const { fetch: authFetch, isReady } = useAuthenticatedFetch();

  const fetchAnalytics = async () => {
    if (!isReady) return;
    try {
      setLoading(true);
      const [revRes, pmRes, geoRes, srRes] = await Promise.all([
        authFetch(`/api/v1/analytics/revenue?days=${period}`),
        authFetch(`/api/v1/analytics/payment-methods`),
        authFetch(`/api/v1/analytics/geography`),
        authFetch(`/api/v1/analytics/success-rate?days=${period}`)
      ]);

      const [revData, pmData, geoData, srData] = await Promise.all([
        revRes.json(),
        pmRes.json(),
        geoRes.json(),
        srRes.json()
      ]);

      setData({
        revenue: revData.data || [],
        paymentMethods: pmData.data || [],
        geography: geoData.data || [],
        successRate: srData.data || []
      });
    } catch (err) {
      console.error("Analytics fetch error:", err);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, isReady, authFetch]);

  const totalRevenue = data?.revenue.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const avgSuccessRate = data?.successRate.length 
    ? (data.successRate.reduce((acc, curr) => acc + curr.rate, 0) / data.successRate.length).toFixed(1)
    : "0";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Detailed insights into your payment performance</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { label: "7D", value: "7" },
            { label: "30D", value: "30" },
            { label: "90D", value: "90" }
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                period === p.value 
                  ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Revenue"
          value={totalRevenue.toLocaleString()}
          currency="USD"
          icon="payments"
        />
        <MetricCard
          title="Avg Success Rate"
          value={`${avgSuccessRate}%`}
          icon="check_circle"
        />
        <MetricCard
          title="Top Method"
          value={data?.paymentMethods[0]?.method || "N/A"}
          icon="trending_up"
        />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Revenue Over Time</h2>
        <div className="h-64 flex items-end gap-1 sm:gap-2">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400">Loading...</div>
          ) : data?.revenue.length ? (
            data.revenue.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div 
                  className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 rounded-t-sm transition-all relative"
                  style={{ height: `${(d.amount / (Math.max(...data.revenue.map(r => r.amount)) || 1)) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                    {d.amount.toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 rotate-45 sm:rotate-0 origin-left">
                  {new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">No data available</div>
          )}
        </div>
      </div>

      {/* Splits */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment Methods</h2>
          <div className="space-y-4">
            {data?.paymentMethods.map((item) => {
              const totalAmount = data.paymentMethods.reduce((a, b) => a + b.amount, 0);
              const percentage = (item.amount / totalAmount) * 100;
              return (
                <div key={item.method}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400">{item.method}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.amount.toLocaleString()} USD</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Geography</h2>
          <div className="space-y-4">
            {data?.geography.map((item) => (
              <div key={item.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 dark:text-white">{item.country || "Unknown"}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.amount.toLocaleString()} USD</p>
                  <p className="text-xs text-slate-500">{item.count} txs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  currency,
  icon,
}: {
  title: string;
  value: string;
  currency?: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">{icon}</span>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        {currency && <span className="text-xs text-slate-400 font-bold">{currency}</span>}
      </div>
    </div>
  );
}
