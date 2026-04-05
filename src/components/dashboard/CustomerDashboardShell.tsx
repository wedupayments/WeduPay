import { DashboardHeader } from "@/components/dashboard/Header";
import { StatsCard } from "@/components/StatsCard";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentReference = {
  title: string;
  ref: string;
  icon: string;
};

export type Transaction = {
  purpose: string;
  term: string;
  date: string;
  amount: string;
  status: string;
  statusColor: string;
};

export type CustomerDashboardData = {
  userName: string | null;
  pendingApprovals: number | null;
  verifiedThisSemester: string | null;
  primaryMerchant: string | null;
  activeReferences: PaymentReference[];
  recentTransactions: Transaction[];
};

// ─── Shell Component ──────────────────────────────────────────────────────────

interface Props {
  data: CustomerDashboardData;
}

export function CustomerDashboardShell({ data }: Props) {
  const empty = (val: string | number | null, fallback = "—") =>
    val !== null && val !== undefined ? String(val) : fallback;

  const hasActivity =
    data.activeReferences.length > 0 || data.recentTransactions.length > 0;

  return (
    <>
      <DashboardHeader title="Customer Dashboard" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 mb-20 lg:mb-0">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {data.userName ? `Welcome back, ${data.userName}` : "Welcome back"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">Ready to manage your payments?</p>
          </div>
          <Link 
            href="/dashboard/customer/funding"
            className="flex items-center justify-center gap-2 bg-primary hover:brightness-110 text-background-dark px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 scale-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">add</span>
            New Payment
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatsCard title="Pending Approvals" value={empty(data.pendingApprovals)} icon="pending_actions" />
          <StatsCard title="Verified This Semester" value={empty(data.verifiedThisSemester)} icon="verified" />
          <StatsCard title="Primary Merchant" value={empty(data.primaryMerchant)} icon="account_balance" />
        </div>

        {/* Activity or Empty State */}
        {hasActivity ? (
          <>
            {/* Active References */}
            {data.activeReferences.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Payment References</h3>
                  <button className="text-primary text-sm font-bold hover:underline">View all</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.activeReferences.map((ref) => (
                    <div key={ref.ref} className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 p-5 rounded-2xl flex items-center justify-between group hover:border-primary transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-xl bg-slate-100 dark:bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-primary text-2xl">{ref.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{ref.title}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Ref: {ref.ref}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Transactions */}
            {data.recentTransactions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                </div>
                <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-primary/10">
                          <th className="px-6 py-5 font-bold">Merchant / Purpose</th>
                          <th className="px-6 py-5 font-bold">Date</th>
                          <th className="px-6 py-5 font-bold text-right">Amount</th>
                          <th className="px-6 py-5 font-bold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                        {data.recentTransactions.map((txn, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">{txn.purpose}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Term: {txn.term}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">{txn.date}</td>
                            <td className="px-6 py-5 text-sm font-black text-right text-slate-900 dark:text-white">{txn.amount}</td>
                            <td className="px-6 py-5 text-center">
                              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border border-opacity-30 ${txn.statusColor} bg-opacity-10 dark:bg-opacity-20`}>
                                {txn.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-5 border-t border-slate-100 dark:border-primary/5 bg-slate-50/50 dark:bg-transparent text-center">
                    <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">See Full History</button>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="rounded-2xl bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 shadow-sm p-16 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-4xl">receipt_long</span>
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">No payment history yet</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Once you make your first payment, your transaction history, active references, and account stats will appear here.
              </p>
            </div>
            <Link 
              href="/dashboard/customer/funding"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-background-dark text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Make First Payment
            </Link>
          </div>
        )}


        <div className="h-12"></div>
      </div>
    </>
  );
}
