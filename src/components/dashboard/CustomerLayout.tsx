"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

interface CustomerLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userId?: string;
  title?: string;
}

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard/customer" },
  { label: "Payments", icon: "receipt_long", href: "/dashboard/customer/payments" },
  { label: "History", icon: "history", href: "/dashboard/customer/history" },
  { label: "Funding", icon: "account_balance_wallet", href: "/dashboard/customer/funding" },
  { label: "Settings", icon: "settings", href: "/dashboard/customer/settings" },
];

export function CustomerLayout({ children, userName = "Student", userId = "00000", title = "Student Dashboard" }: CustomerLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background-dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark hidden lg:flex flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-9 bg-primary rounded-lg flex items-center justify-center text-background-dark group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined font-bold text-lg">payments</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">WeduPay</h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Student</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/5"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-primary/10">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-primary/5">
            <div className="size-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-background-dark font-bold text-sm">
              {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{userName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">ID: {userId}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-600 dark:text-slate-400 p-2">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-600 dark:text-slate-400 relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white dark:border-background-dark"></span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-primary/10 flex justify-around p-3 z-20 shrink-0">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${isActive ? "text-primary" : "text-slate-500"}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
