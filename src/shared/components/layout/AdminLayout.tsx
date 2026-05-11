"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { useAuth } from "@/shared/auth/AuthContext";
import { PWAInstallButton } from "@/shared/components/PWAInstallButton";
import { QuickFXCalculator } from "@/features/fx/components/QuickFXCalculator";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Overview", icon: "dashboard", href: "/dashboard/admin" },
  { label: "Transfers", icon: "swap_horiz", href: "/dashboard/admin/transfers" },
  { label: "Compliance", icon: "verified_user", href: "/dashboard/admin/compliance" },
];

const bottomNavItems = [
  { label: "Overview", icon: "dashboard", href: "/dashboard/admin" },
  { label: "Transfers", icon: "swap_horiz", href: "/dashboard/admin/transfers" },
  { label: "Compliance", icon: "verified_user", href: "/dashboard/admin/compliance" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const displayName = user?.email?.split("@")[0] || "Admin";
  const displayRole = user?.role || "ADMIN";

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="app-mobile-shell flex flex-col lg:flex-row min-h-dvh bg-slate-50 dark:bg-background-dark">
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
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-dvh lg:min-h-0">
        {/* Header */}
        <header className="app-topbar min-h-14 sm:min-h-16 border-b border-slate-200 dark:border-primary/10 bg-white/85 dark:bg-background-dark/85 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 lg:static">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden text-slate-600 dark:text-slate-400 min-h-11 min-w-11 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-primary/10"
              aria-label="Open navigation"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <QuickFXCalculator compact />
            <PWAInstallButton compact className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:border-primary/20 dark:hover:bg-primary/10" />
            <button className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-600 dark:text-slate-400 relative min-h-[44px] min-w-[44px] flex items-center justify-center">
              <span className="material-symbols-outlined text-xl sm:text-2xl">notifications</span>
              <span className="absolute top-1 right-1 size-1.5 sm:size-2 bg-primary rounded-full border border-white dark:border-background-dark"></span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <div className="app-content flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 lg:pb-8">
          {children}
        </div>
      </main>

      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,22rem)] flex-col bg-white p-4 shadow-2xl dark:bg-background-dark">
            <div className="app-topbar flex items-center justify-between pb-4">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/favicon.svg" alt="WeduPay mark" width={36} height={36} className="size-9 rounded-lg" />
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">WeduPay</h2>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-primary/10"
                aria-label="Close navigation"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary/5"
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={() => void logout()}
              className="safe-area-bottom flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Sign Out</span>
            </button>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="app-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 border-t border-slate-200 dark:border-primary/10 flex justify-around px-2 pt-2 z-30 backdrop-blur-xl">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-1 rounded-2xl min-h-[50px] min-w-0 justify-center ${isActive ? "bg-primary/10 text-primary" : "text-slate-500"}`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="max-w-full truncate text-[9px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
