"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  colorClass: string;
}

export function StatCard({ title, value, icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 p-4 sm:p-6 rounded-2xl hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className={`p-2 rounded-lg ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
          <span className="material-symbols-outlined text-xl sm:text-2xl">{icon}</span>
        </span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">{title}</p>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
    </div>
  );
}

interface StatsGridProps {
  stats?: {
    pendingApprovals: number;
    totalSpent: string;
    primaryMerchant: string;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  const data = stats || {
    pendingApprovals: 0,
    totalSpent: "",
    primaryMerchant: "",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <StatCard
        title="Pending Approvals"
        value={data.pendingApprovals}
        icon="pending_actions"
        colorClass="text-primary bg-primary"
      />
      <StatCard
        title="Total Spent"
        value={data.totalSpent || "--"}
        icon="payments"
        colorClass="text-blue-500 bg-blue-500"
      />
      <StatCard
        title="Primary Merchant"
        value={data.primaryMerchant || "--"}
        icon="account_balance"
        colorClass="text-orange-500 bg-orange-500"
      />
    </div>
  );
}
