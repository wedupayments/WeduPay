interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: string;
}

export function StatsCard({ title, value, change, trend = "neutral", icon }: StatsCardProps) {
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-slate-500";
  const TrendIcon = trend === "up" ? "trending_up" : trend === "down" ? "trending_down" : "remove";

  return (
    <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 p-4 sm:p-6 rounded-2xl hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className="size-10 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendColor}`}>
            <span className="material-symbols-outlined text-sm">{TrendIcon}</span>
            <span>{change}</span>
          </div>
        )}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-xl lg:text-2xl font-black mt-1 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{value}</h3>
    </div>
  );
}
