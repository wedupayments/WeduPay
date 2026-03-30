"use client";

interface Transaction {
  id: string;
  merchant: string;
  purpose: string;
  term: string;
  date: string;
  amount: string;
  status: "Verified" | "Pending" | "Processing" | "Failed";
}

interface TransactionRowProps {
  transaction: Transaction;
}

function getStatusStyles(status: Transaction["status"]) {
  switch (status) {
    case "Verified":
      return "bg-primary/20 text-primary border-primary/20";
    case "Pending":
      return "bg-orange-500/20 text-orange-500 border-orange-500/20";
    case "Processing":
      return "bg-blue-500/20 text-blue-500 border-blue-500/20";
    case "Failed":
      return "bg-red-500/20 text-red-500 border-red-500/20";
  }
}

function TransactionRow({ transaction }: TransactionRowProps) {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm text-slate-900 dark:text-white">{transaction.merchant}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{transaction.purpose} • {transaction.term}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{transaction.date}</td>
      <td className="px-6 py-4 text-sm font-bold text-right text-slate-900 dark:text-white">{transaction.amount}</td>
      <td className="px-6 py-4 text-center">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusStyles(transaction.status)}`}>
          {transaction.status}
        </span>
      </td>
    </tr>
  );
}

interface TransactionTableProps {
  transactions?: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const txs = transactions || [];

  if (txs.length === 0) {
    return (
      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Transactions</h3>
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 rounded-2xl overflow-hidden p-12 text-center">
          <div className="size-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-primary/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-slate-400 dark:text-slate-500">receipt_long</span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">No Transactions Yet</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            When you make payments, they will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Transactions</h3>
      <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Merchant / Purpose</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
              {txs.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-primary/5 bg-slate-50/50 dark:bg-transparent text-center">
          <button className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            See Full History
          </button>
        </div>
      </div>
    </section>
  );
}
