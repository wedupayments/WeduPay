import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-primary/20 px-4 py-3 md:py-4 lg:px-20">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl md:text-3xl">account_balance_wallet</span>
        </div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight">WeduPay</h2>
      </div>
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#solutions">Solutions</Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#benefits">Benefits</Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">How it Works</Link>

      </nav>
      <div className="flex gap-2 md:gap-3 items-center">
        <ThemeToggle />
        <button className="hidden sm:flex items-center justify-center rounded-lg h-9 md:h-10 px-3 md:px-4 bg-primary/10 text-primary border border-primary/20 text-sm font-bold">
          Login
        </button>
        <button className="flex items-center justify-center rounded-lg h-9 md:h-10 px-3 md:px-4 bg-primary text-background-dark text-xs md:text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
          Get Started
        </button>
        <button className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </header>
  );
}
