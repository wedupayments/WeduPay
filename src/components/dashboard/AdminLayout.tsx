"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Overview", icon: "dashboard", href: "/dashboard" },
  { label: "Merchants", icon: "storefront", href: "/dashboard/merchants" },
  { label: "Network", icon: "hub", href: "/dashboard/network" },
  { label: "Reports", icon: "analytics", href: "/dashboard/reports" },
  { label: "Settings", icon: "settings", href: "/dashboard/settings" },
];

const bottomNavItems = [
  { label: "Overview", icon: "dashboard", href: "/dashboard" },
  { label: "Merchants", icon: "storefront", href: "/dashboard/merchants" },
  { label: "Network", icon: "hub", href: "/dashboard/network" },
  { label: "Reports", icon: "analytics", href: "/dashboard/reports" },
  { label: "Settings", icon: "settings", href: "/dashboard/settings" },
];

function handleSignOut() {
  document.cookie = "sb-access-token=; path=/; max-age=0";
  document.cookie = "wedupay-user-id=; path=/; max-age=0";
  document.cookie = "wedupay-user-email=; path=/; max-age=0";
  window.location.href = "/";
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-background-dark">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-primary/10">
        <div className="p-4 flex items-center gap-3">
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
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin</p>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/5"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-primary/10 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-primary/5">
            <div className="size-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-background-dark font-bold text-sm shrink-0">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">Admin User</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Header */}
        <header className="h-14 sm:h-16 border-b border-slate-200 dark:border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 lg:static">
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="lg:hidden text-slate-600 dark:text-slate-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-600 dark:text-slate-400 relative min-h-[44px] min-w-[44px] flex items-center justify-center">
              <span className="material-symbols-outlined text-xl sm:text-2xl">notifications</span>
              <span className="absolute top-1 right-1 size-1.5 sm:size-2 bg-primary rounded-full border border-white dark:border-background-dark"></span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-primary/10 flex justify-around p-2 z-30">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-h-[44px] min-w-[44px] justify-center ${isActive ? "text-primary" : "text-slate-500"}`}
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
