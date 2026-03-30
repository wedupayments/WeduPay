"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-primary/10 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-primary/5 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
