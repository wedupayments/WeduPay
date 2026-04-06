"use client";

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Detailed insights into your payment performance</p>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["7 days", "30 days", "90 days", "1 year", "All time"].map((period) => (
          <button
            key={period}
            className="px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {period}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="$24,890"
          change="+15.3%"
          positive
          icon="payments"
        />
        <MetricCard
          title="Transactions"
          value="1,234"
          change="+8.2%"
          positive
          icon="receipt_long"
        />
        <MetricCard
          title="Avg Transaction"
          value="$20.17"
          change="+3.1%"
          positive
          icon="trending_up"
        />
        <MetricCard
          title="Success Rate"
          value="98.5%"
          change="+0.5%"
          positive
          icon="check_circle"
        />
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Revenue Over Time</h2>
        <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700">show_chart</span>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Chart visualization coming soon</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment Methods</h2>
          <div className="space-y-3">
            {[
              { method: "Mobile Money", percentage: 45, amount: "$11,200" },
              { method: "Card Payment", percentage: 35, amount: "$8,712" },
              { method: "Bank Transfer", percentage: 20, amount: "$4,978" },
            ].map((item) => (
              <div key={item.method}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">{item.method}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.amount}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Top Countries</h2>
          <div className="space-y-4">
            {[
              { country: "Kenya", flag: "🇰🇪", amount: "$8,450", percentage: 34 },
              { country: "Nigeria", flag: "🇳🇬", amount: "$6,230", percentage: 25 },
              { country: "Ghana", flag: "🇬🇭", amount: "$5,120", percentage: 21 },
              { country: "Uganda", flag: "🇺🇬", amount: "$3,090", percentage: 12 },
            ].map((item) => (
              <div key={item.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.flag}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.country}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.amount}</p>
                  <p className="text-xs text-slate-500">{item.percentage}%</p>
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
  change,
  positive,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">{icon}</span>
        <span className={`text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
          {change}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}
