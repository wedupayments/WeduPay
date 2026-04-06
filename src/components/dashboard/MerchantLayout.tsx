"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

interface MerchantLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userId?: string;
  title?: string;
}

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard/merchant" },
  { label: "Payments", icon: "payments", href: "/dashboard/merchant/payments" },
  { label: "Payment Links", icon: "link", href: "/dashboard/merchant/payment-links" },
  { label: "API Keys", icon: "key", href: "/dashboard/merchant/api-keys" },
  { label: "Settlements", icon: "account_balance", href: "/dashboard/merchant/settlements" },
  { label: "Analytics", icon: "analytics", href: "/dashboard/merchant/analytics" },
  { label: "Settings", icon: "settings", href: "/dashboard/merchant/settings" },
];

const bottomNavItems = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard/merchant" },
  { label: "Payments", icon: "payments", href: "/dashboard/merchant/payments" },
  { label: "Links", icon: "link", href: "/dashboard/merchant/payment-links" },
  { label: "Analytics", icon: "analytics", href: "/dashboard/merchant/analytics" },
  { label: "Settings", icon: "settings", href: "/dashboard/merchant/settings" },
];

export function MerchantLayout({ children, userName = "Merchant", userId = "00000", title = "Dashboard" }: MerchantLayoutProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-background-dark">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-primary/10">
        <div className="p-4 sm:p-6 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/favicon.svg"
              alt="WeduPay mark"
              width={36}
              height={36}
              className="size-9 rounded-lg"
            />
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">WeduPay</h2>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Merchant</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 sm:px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/5"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-primary/10 space-y-2">
          <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl bg-slate-100 dark:bg-primary/5">
            <div className="size-8 sm:size-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
              {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{userName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">ID: {userId}</p>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Header */}
        <header className="h-14 sm:h-16 border-b border-slate-200 dark:border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 lg:static">
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="lg:hidden text-slate-600 dark:text-slate-400 p-1">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-600 dark:text-slate-400 relative">
              <span className="material-symbols-outlined text-xl sm:text-2xl">notifications</span>
              <span className="absolute top-1 right-1 size-1.5 sm:size-2 bg-emerald-600 rounded-full border border-white dark:border-background-dark"></span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-primary/10 flex justify-around p-2 z-30 safe-area-bottom">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-h-[44px] min-w-[44px] justify-center ${isActive ? "text-emerald-600" : "text-slate-500"}`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-[9px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
