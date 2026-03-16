import Link from "next/link";

const navItems = [
  { label: "Overview", icon: "dashboard", href: "/dashboard/admin" },
  { label: "Merchant Mgmt", icon: "storefront", href: "#" },
  { label: "Wallet Providers", icon: "account_balance", href: "#" },
  { label: "Verification", icon: "verified_user", href: "#", count: 12 },
];

export function AdminSidebar() {
  return (
    <aside className="w-full lg:w-64 bg-slate-50 dark:bg-background-dark/50 border-r border-slate-200 dark:border-emerald-900/30 p-4 space-y-6 flex flex-col h-screen sticky top-0">
      <div className="space-y-1">
        <p className="px-3 text-xs font-bold text-slate-400 dark:text-emerald-800 uppercase tracking-wider mb-2">Main Menu</p>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
              item.label === "Overview"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-emerald-900/20"
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${item.label === "Overview" ? "text-primary" : "group-hover:text-primary"}`}>
              {item.icon}
            </span>
            <p className={`text-sm ${item.label === "Overview" ? "font-semibold" : "font-medium group-hover:text-slate-900 dark:group-hover:text-white"}`}>
              {item.label}
            </p>
            {item.count && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="space-y-1">
        <p className="px-3 text-xs font-bold text-slate-400 dark:text-emerald-800 uppercase tracking-wider mb-2">System Health</p>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(17,212,115,0.6)] animate-pulse"></div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gateway API</span>
          </div>
          <span className="text-[10px] text-primary font-bold">99.9%</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(17,212,115,0.6)]"></div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Merchant Portal</span>
          </div>
          <span className="text-[10px] text-primary font-bold">100%</span>
        </div>
      </div>

      <div className="mt-auto pt-10">
        <div className="rounded-xl bg-linear-to-br from-emerald-900/40 to-emerald-950/60 p-4 border border-emerald-800/30">
          <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">Platform Owner</p>
          <p className="text-sm text-slate-300 leading-tight mb-3">You are in Super Admin mode. All actions are logged.</p>
          <button className="w-full py-2 bg-primary hover:brightness-110 active:scale-95 text-slate-900 text-xs font-bold rounded-lg transition-all">
            Support Center
          </button>
        </div>
      </div>
    </aside>
  );
}
