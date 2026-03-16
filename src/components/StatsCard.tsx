interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  colorClass: string;
}

export function StatsCard({ label, value, icon, colorClass }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 p-6 rounded-2xl hover:border-primary group transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <span className={`p-2 rounded-lg ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl lg:text-3xl font-black mt-1 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{value}</h3>
    </div>
  );
}
