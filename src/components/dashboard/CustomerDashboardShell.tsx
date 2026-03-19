import { DashboardHeader } from "@/components/DashboardHeader";
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
  isDemo?: boolean;
}

export function CustomerDashboardShell({ data, isDemo = false }: Props) {
  const empty = (val: string | number | null, fallback = "—") =>
    val !== null && val !== undefined ? String(val) : fallback;

  const hasActivity =
    data.activeReferences.length > 0 || data.recentTransactions.length > 0;

  return (
    <>
      <DashboardHeader title={isDemo ? "Student Dashboard (Demo)" : "Student Dashboard"} />

      {/* Demo Banner */}
      {isDemo && (
        <div className="mx-8 mt-6 flex items-center justify-between gap-3 px-5 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 text-yellow-800 dark:text-yellow-300">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">science</span>
            <p className="text-sm font-bold">Demo Mode — Transactions, references and stats below are sample placeholder data only.</p>
          </div>
          <Link href="/dashboard/customer" className="text-xs font-black uppercase tracking-widest underline shrink-0">
            Go to Live Dashboard →
          </Link>
        </div>
      )}

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8 mb-20 lg:mb-0">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {data.userName ? `Welcome back, ${data.userName}` : "Welcome back"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">Ready to manage your education payments?</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-primary hover:brightness-110 text-background-dark px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 scale-100 hover:scale-[1.02] active:scale-[0.98]">
            <span className="material-symbols-outlined">add</span>
            New Payment
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatsCard label="Pending Approvals" value={empty(data.pendingApprovals)} icon="pending_actions" colorClass="text-primary bg-primary" />
          <StatsCard label="Verified This Semester" value={empty(data.verifiedThisSemester)} icon="verified" colorClass="text-blue-500 bg-blue-500" />
          <StatsCard label="Primary Merchant" value={empty(data.primaryMerchant)} icon="account_balance" colorClass="text-orange-500 bg-orange-500" />
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
                    <table className="w-full text-left border-collapse min-w-[600px]">
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
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-background-dark text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-sm">add</span>
                Make First Payment
              </button>
              <Link href="/demo/customer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-black hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-sm">science</span>
                Preview with demo data
              </Link>
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex items-start gap-6 group hover:bg-primary/10 transition-colors">
          <div className="p-3 bg-primary/20 rounded-xl text-primary transform group-hover:rotate-12 transition-transform">
            <span className="material-symbols-outlined text-3xl">verified_user</span>
          </div>
          <div>
            <h4 className="font-black text-xl text-primary mb-2">Secure Payment System</h4>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              WeduPay uses end-to-end encryption for all institutional transfers. Your payments are verified directly with institutions within 24–48 business hours.
            </p>
          </div>
        </div>

        <div className="h-12"></div>
      </div>
    </>
  );
}
