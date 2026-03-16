import Link from "next/link";
import Image from "next/image";

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard/customer" },
  { label: "Payments", icon: "receipt_long", href: "#" },
  { label: "History", icon: "history", href: "#" },
  { label: "Funding", icon: "account_balance_wallet", href: "#" },
  { label: "Settings", icon: "settings", href: "#" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined font-bold">account_balance_wallet</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">WeduPay</h2>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              item.label === "Dashboard"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/5"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-primary/10">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-primary/5 hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors cursor-pointer group">
          <div className="size-10 rounded-full bg-slate-300 dark:bg-primary/20 bg-cover bg-center overflow-hidden border-2 border-transparent group-hover:border-primary transition-all relative">
            <Image 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" 
              alt="User" 
              fill
              className="object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">Alex Johnson</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">ID: 88291</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
