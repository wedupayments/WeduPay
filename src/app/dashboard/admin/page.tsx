import { DashboardHeader } from "@/components/DashboardHeader";
import { StatsCard } from "@/components/StatsCard";

const HIGH_VALUE_FLOWS = [
  {
    merchant: "Amazon Zim Retail",
    code: "AZ",
    channel: "EcoCash Wallet",
    amount: "$14,200.00",
    status: "COMPLETED",
    statusColor: "text-primary bg-primary/10",
    time: "2 mins ago"
  },
  {
    merchant: "TechStore Bulawayo",
    code: "TS",
    channel: "Mukuru Cash",
    amount: "$8,540.50",
    status: "COMPLETED",
    statusColor: "text-primary bg-primary/10",
    time: "12 mins ago"
  },
  {
    merchant: "Safari Africa Ltd",
    code: "SA",
    channel: "International Card",
    amount: "$25,000.00",
    status: "PENDING",
    statusColor: "text-yellow-500 bg-yellow-500/10",
    time: "45 mins ago"
  }
];

export default function AdminDashboard() {
  return (
    <>
      <DashboardHeader title="Platform Overview" />
      
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8 mb-20 lg:mb-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Platform Overview</h1>
            <p className="text-slate-500 dark:text-emerald-700 font-medium text-lg mt-1">Monitoring WeduPay Global Performance & Network</p>
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
          <div className="group flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-emerald-900/10 border border-slate-200 dark:border-emerald-900/30 hover:border-primary/40 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Daily Routed Volume</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl text-xl">payments</span>
            </div>
            <div className="mt-2">
              <p className="text-slate-900 dark:text-white text-3xl font-black tabular-nums">$1.24M</p>
              <p className="text-primary text-sm font-bold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">trending_up</span> +12.5%
              </p>
            </div>
          </div>

          <div className="group flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-emerald-900/10 border border-slate-200 dark:border-emerald-900/30 hover:border-primary/40 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Monthly Volume</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl text-xl">query_stats</span>
            </div>
            <div className="mt-2">
              <p className="text-slate-900 dark:text-white text-3xl font-black tabular-nums">$34.82M</p>
              <p className="text-primary text-sm font-bold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">trending_up</span> +8.2%
              </p>
            </div>
          </div>

          <div className="group flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-emerald-900/10 border border-slate-200 dark:border-emerald-900/30 hover:border-primary/40 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Active Merchants</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl text-xl">groups</span>
            </div>
            <div className="mt-2">
              <p className="text-slate-900 dark:text-white text-3xl font-black tabular-nums">1,240</p>
              <p className="text-primary text-sm font-bold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">person_add</span> +4.1%
              </p>
            </div>
          </div>

          <div className="group flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-emerald-900/10 border border-slate-200 dark:border-emerald-900/30 hover:border-primary/40 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Wallet Providers</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl text-xl">lan</span>
            </div>
            <div className="mt-2">
              <p className="text-slate-900 dark:text-white text-3xl font-black tabular-nums">12</p>
              <p className="text-slate-500 dark:text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest">Stable status</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Placeholder / Volume Trends */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-emerald-900/5 border border-slate-200 dark:border-emerald-900/30 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transaction Volume Trends</h3>
                <p className="text-sm text-slate-500 dark:text-emerald-700 mt-1">Weekly routing distribution across all channels</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/10"></div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-slate-300 dark:bg-emerald-900 ring-4 ring-slate-100 dark:ring-emerald-900/20"></div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Previous</span>
                </div>
              </div>
            </div>
            <div className="h-64 relative">
              <svg className="w-full h-full lg:h-72" fill="none" preserveAspectRatio="none" viewBox="0 0 478 150">
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z" fill="url(#chartGradient)"></path>
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#11d473" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(17,212,115,0.4)]"></path>
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#11d473" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="#11d473" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-between mt-6 px-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <p key={day} className="text-slate-400 dark:text-emerald-900/50 text-[10px] font-black uppercase tracking-widest">{day}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Network */}
          <div className="space-y-8">
            <div className="rounded-2xl bg-white dark:bg-emerald-900/5 border border-slate-200 dark:border-emerald-900/30 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 uppercase tracking-wide">Network Status</h3>
              <div className="space-y-4">
                {[
                  { name: "EcoCash", code: "EC", status: "Connected", vol: "$450k", color: "text-primary" },
                  { name: "Mukuru", code: "MK", status: "Connected", vol: "$320k", color: "text-primary" },
                  { name: "OneMoney", code: "OM", status: "Maintenance", vol: "$0", color: "text-yellow-500" }
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-emerald-900/10 border border-slate-100 dark:border-emerald-800/20 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-slate-200 dark:bg-emerald-900 flex items-center justify-center font-black text-slate-600 dark:text-primary text-xs ring-2 ring-transparent group-hover:ring-primary/20 transition-all">{p.code}</div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{p.name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${p.color}`}>{p.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{p.vol}</p>
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

        {/* Recent High-Value Flows Table */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Recent High-Value Flows</h3>
            <button className="text-primary text-sm font-black hover:underline uppercase tracking-widest px-4 py-2 bg-primary/5 rounded-lg">View All Records</button>
          </div>
          <div className="bg-white dark:bg-emerald-900/5 border border-slate-200 dark:border-emerald-900/30 rounded-2xl overflow-hidden shadow-sm">
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
                  {HIGH_VALUE_FLOWS.map((flow, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-emerald-900/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-black group-hover:bg-primary/20 transition-colors">{flow.code}</div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{flow.merchant}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-emerald-900/20 rounded-lg group-hover:border-primary/20 transition-all border border-transparent italic">{flow.channel}</span>
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
          </div>
        </section>

        {/* Spacer */}
        <div className="h-12"></div>
      </div>
    </>
  );
}
