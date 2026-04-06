"use client";

export default function SettlementsPage() {
  const settlements = [
    {
      id: "1",
      period: "Jan 1 - Jan 7, 2024",
      amount: "$2,450.00",
      status: "completed",
      date: "Jan 8, 2024",
      transactions: 45,
    },
    {
      id: "2",
      period: "Jan 8 - Jan 14, 2024",
      amount: "$3,120.00",
      status: "pending",
      date: "Jan 15, 2024",
      transactions: 62,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settlements</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Track your payment settlements and payouts</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">Available Balance</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">$5,670.00</p>
          <button className="mt-4 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors">
            Request Payout
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">Pending Settlement</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">$3,120.00</p>
          <p className="text-sm text-slate-500 mt-2">Settles in 2 days</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Settled</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">$24,890.00</p>
          <p className="text-sm text-emerald-600 mt-2">+15.3% this month</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settlement History</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {settlements.map((settlement) => (
            <div key={settlement.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{settlement.period}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {settlement.transactions} transactions
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{settlement.amount}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{settlement.date}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    settlement.status === "completed"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  }`}>
                    {settlement.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
