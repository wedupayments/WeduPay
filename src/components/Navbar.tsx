"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-primary/20 px-4 py-3 md:py-4 lg:px-20 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl md:text-3xl">account_balance_wallet</span>
        </div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight">WeduPay</h2>
      </div>

      {/* Mobile menu toggle */}
      <button
        className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="material-symbols-outlined">
          {isMenuOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Desktop navigation */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#benefits">Benefits</Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">How it Works</Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#cta">Get Started</Link>
      </nav>

      {/* Desktop actions */}
      <div className="hidden md:flex gap-3 items-center">
        <ThemeToggle />
        <Link href="/auth/login" className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary border border-primary/20 text-sm font-bold hover:bg-primary/20 transition-colors">
          Login
        </Link>
        <Link href="/auth/register" className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
          Get Started
        </Link>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-primary/20 shadow-lg md:hidden">
          <nav className="flex flex-col p-4 gap-1">
            <Link 
              className="text-base font-medium hover:text-primary transition-colors p-3 min-h-[44px] flex items-center rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10" 
              href="#benefits"
              onClick={() => setIsMenuOpen(false)}
            >
              Benefits
            </Link>
            <Link 
              className="text-base font-medium hover:text-primary transition-colors p-3 min-h-[44px] flex items-center rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10" 
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link 
              className="text-base font-medium hover:text-primary transition-colors p-3 min-h-[44px] flex items-center rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10" 
              href="#cta"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </nav>
          <div className="flex flex-col gap-2 p-4 border-t border-slate-200 dark:border-primary/20">
            <ThemeToggle />
            <Link href="/auth/login" className="flex items-center justify-center rounded-lg h-11 px-4 bg-primary/10 text-primary border border-primary/20 text-base font-bold hover:bg-primary/20 transition-colors">
              Login
            </Link>
            <Link href="/auth/register" className="flex items-center justify-center rounded-lg h-11 px-4 bg-primary text-background-dark text-base font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
