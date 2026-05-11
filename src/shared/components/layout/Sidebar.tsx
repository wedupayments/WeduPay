"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QuickFXCalculator } from "@/features/fx/components/QuickFXCalculator";

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Wallets", icon: "account_balance_wallet", href: "/dashboard/wallets" },
  { label: "Transactions", icon: "swap_horiz", href: "/dashboard/transactions" },
  { label: "Analytics", icon: "analytics", href: "/dashboard/analytics" },
  { label: "Settings", icon: "settings", href: "/dashboard/settings" },
];

interface SidebarProps {
  userType?: "MERCHANT" | "CUSTOMER";
}

export function Sidebar({ userType = "MERCHANT" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={`
        bg-white dark:bg-background-dark border-r border-slate-200 dark:border-primary/10 
        flex flex-col h-screen sticky top-0 transition-all duration-300
        ${collapsed ? "w-20" : "w-72"}
        hidden lg:flex
      `}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-primary/10">
        {!collapsed && (
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
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{userType === "MERCHANT" ? "Merchant" : "Customer"}</p>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="size-9 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/5 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">
            {collapsed ? "menu_open" : "close_fullscreen"}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
              ${collapsed ? "justify-center" : ""}
              ${item.label === "Dashboard"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/5"
              }
            `}
          >
            <span className={`material-symbols-outlined text-xl ${collapsed ? "" : "group-hover:text-primary"}`}>
              {item.icon}
            </span>
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Quick FX Calculator trigger */}
      <div className="p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <QuickFXCalculator compact />
          </div>
        ) : (
          <div className="px-1">
            <QuickFXCalculator className="w-full justify-center rounded-xl" triggerLabel="View FX" />
          </div>
        )}
      </div>

      {/* System Status */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-primary/10">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(17,212,115,0.6)] animate-pulse"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">System Online</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">API</span>
                <span className="text-[10px] font-bold text-primary">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Wallets</span>
                <span className="text-[10px] font-bold text-primary">100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-3 border-t border-slate-200 dark:border-primary/10">
        <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-primary/5 transition-colors cursor-pointer group ${collapsed ? "justify-center" : ""}`}>
          <div className="size-10 rounded-full bg-linear-to-br from-primary to-emerald-600 flex items-center justify-center text-background-dark font-bold text-sm border-2 border-transparent group-hover:border-primary transition-all shrink-0">
            {userType === "MERCHANT" ? "M" : "C"}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">User Account</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userType}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
