import { DashboardHeader } from "@/components/dashboard/Header";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NetworkProvider = {
  name: string;
  code: string;
  status: string;
  vol: string | null;
  color: string;
};

export type HighValueFlow = {
  merchant: string;
  code: string;
  channel: string;
  amount: string;
  status: string;
  statusColor: string;
  time: string;
};

export type AdminDashboardData = {
  dailyVolume: string | null;
  dailyDelta: string | null;
  monthlyVolume: string | null;
  monthlyDelta: string | null;
  activeMerchants: number | null;
  merchantsDelta: string | null;
  walletProviders: number | null;
  networkProviders: NetworkProvider[];
  recentFlows: HighValueFlow[];
};

// ─── Shell Component ──────────────────────────────────────────────────────────

interface Props {
  data: AdminDashboardData;
}

export function AdminDashboardShell({ data }: Props) {
  const empty = (val: string | number | null) => val ?? "—";

  return (
    <>
      <DashboardHeader title="Platform Overview" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 mb-20 lg:mb-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Platform Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">Monitoring WeduPay Global Performance & Network</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-emerald-900/20 border border-slate-200 dark:border-emerald-800/40 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-emerald-900/40 transition-all shadow-sm">
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              Last 30 Days
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-primary text-slate-900 rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl">download</span>
              Reports
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Daily Routed Volume", icon: "payments", value: empty(data.dailyVolume), delta: data.dailyDelta },
            { label: "Monthly Volume", icon: "query_stats", value: empty(data.monthlyVolume), delta: data.monthlyDelta },
            { label: "Active Merchants", icon: "groups", value: empty(data.activeMerchants), delta: data.merchantsDelta },
            { label: "Wallet Providers", icon: "lan", value: empty(data.walletProviders), delta: null, sub: "Configured" },
          ].map((card) => (
            <div key={card.label} className="group flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-emerald-900/10 border border-slate-200 dark:border-emerald-900/30 hover:border-primary/40 transition-all shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{card.label}</p>
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl text-xl">{card.icon}</span>
              </div>
              <div className="mt-2">
                <p className={`text-3xl font-black tabular-nums ${card.value === "—" ? "text-slate-300 dark:text-slate-600" : "text-slate-900 dark:text-white"}`}>
                  {card.value}
                </p>
                {card.delta ? (
                  <p className="text-primary text-sm font-bold flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm">trending_up</span> {card.delta}
                  </p>
                ) : (
                  <p className="text-slate-400 dark:text-slate-600 text-xs font-bold mt-1 uppercase tracking-widest">
                    {card.sub ?? "No data yet"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Chart / Empty State */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-emerald-900/5 border border-slate-200 dark:border-emerald-900/30 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transaction Volume Trends</h3>
                <p className="text-sm text-slate-500 dark:text-emerald-700 mt-1">Weekly routing distribution across all channels</p>
              </div>
            </div>

            <div className="h-64 flex flex-col items-center justify-center text-center gap-4">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl">bar_chart</span>
              <p className="text-slate-400 dark:text-slate-600 text-sm font-medium max-w-xs">
                Volume trends will appear here once transactions start flowing through the platform.
              </p>
            </div>
          </div>

          {/* Network & Quick Actions */}
          <div className="space-y-8">
            <div className="rounded-2xl bg-white dark:bg-emerald-900/5 border border-slate-200 dark:border-emerald-900/30 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 uppercase tracking-wide">Network Status</h3>
              <div className="space-y-4">
                {data.networkProviders.map((p) => (
                  <div key={p.name} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-emerald-900/10 border border-slate-100 dark:border-emerald-800/20 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-slate-200 dark:bg-emerald-900 flex items-center justify-center font-black text-slate-600 dark:text-primary text-xs ring-2 ring-transparent group-hover:ring-primary/20 transition-all">{p.code}</div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{p.name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${p.color}`}>{p.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{p.vol ?? "—"}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">24h Vol</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 p-6">
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-5">Quick Shortcuts</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Approve KYB", icon: "how_to_reg" },
                  { label: "Add Merchant", icon: "add_business" },
                  { label: "System Logs", icon: "monitoring" },
                  { label: "Invoicing", icon: "receipt_long" }
                ].map((btn) => (
                  <button key={btn.label} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-emerald-950/40 rounded-2xl border border-primary/10 hover:border-primary/50 transition-all gap-2 group shadow-sm hover:shadow-md hover:-translate-y-1">
                    <span className="material-symbols-outlined text-primary group-hover:scale-125 transition-transform text-2xl">{btn.icon}</span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent High-Value Flows */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Recent High-Value Flows</h3>
            <button className="text-primary text-sm font-black hover:underline uppercase tracking-widest px-4 py-2 bg-primary/5 rounded-lg">View All Records</button>
          </div>
          <div className="bg-white dark:bg-emerald-900/5 border border-slate-200 dark:border-emerald-900/30 rounded-2xl overflow-hidden shadow-sm">
            {data.recentFlows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-emerald-900/10 text-slate-500 dark:text-emerald-700 text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-emerald-900/20">
                      <th className="px-6 py-5">Merchant</th>
                      <th className="px-6 py-5">Channel</th>
                      <th className="px-6 py-5">Amount</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/30">
                    {data.recentFlows.map((flow, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-emerald-900/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-slate-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-black group-hover:bg-primary/20 transition-colors">{flow.code}</div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{flow.merchant}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-emerald-900/20 rounded-lg border border-transparent italic">{flow.channel}</span>
                        </td>
                        <td className="px-6 py-5 font-black text-slate-900 dark:text-white tabular-nums">{flow.amount}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-2 py-1 px-3 rounded-full text-[10px] font-black tracking-widest ${flow.statusColor}`}>
                            <span className="size-1.5 rounded-full bg-current animate-ping opacity-75"></span>
                            {flow.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-500 text-right group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{flow.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl">inbox</span>
                <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">No transactions recorded yet.</p>
              </div>
            )}
          </div>
        </section>

        <div className="h-12"></div>
      </div>
    </>
  );
}
