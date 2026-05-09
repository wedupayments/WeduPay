"use client";

import Link from "next/link";
import Image from "next/image";
import { QuickFXCalculator } from "@/components/fx/QuickFXCalculator";

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard/customer", active: false },
  { label: "Send Money", icon: "send", href: "/dashboard/customer/transfers/send", active: false },
  { label: "Transfers", icon: "swap_horiz", href: "/dashboard/customer/transfers", active: false },
  { label: "Payments", icon: "receipt_long", href: "/dashboard/customer/payments", active: false },
  { label: "History", icon: "history", href: "/dashboard/customer/history", active: false },
  { label: "Funding", icon: "account_balance_wallet", href: "/dashboard/customer/funding", active: false },
  { label: "Settings", icon: "settings", href: "/dashboard/customer/settings", active: false },
];

interface CustomerSidebarProps {
  userName?: string;
  userId?: string;
}

export function CustomerSidebar({ userName = "Alex Johnson", userId = "88291" }: CustomerSidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/favicon.svg"
            alt="WeduPay mark"
            width={32}
            height={32}
            className="size-8 rounded-lg"
          />
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">WeduPay</h2>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              item.active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/5"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* FX calculator as nav item */}
        <div className="pt-2">
          <QuickFXCalculator 
            className="w-full px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/5 justify-start gap-3"
            triggerLabel="View FX" 
          />
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-primary/10">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-primary/5">
          <div className="size-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-background-dark font-bold text-sm">
            {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{userName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">ID: {userId}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
