import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-primary/20 px-6 py-4 lg:px-20">
      <div className="flex items-center gap-3">
        <div className="text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">WeduPay</h2>
      </div>
      <nav className="hidden md:flex items-center gap-8">
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#solutions">Solutions</Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#benefits">Benefits</Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">How it Works</Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">Pricing</Link>
      </nav>
      <div className="flex gap-3 items-center">
        <ThemeToggle />
        <button className="hidden sm:flex items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary border border-primary/20 text-sm font-bold">
          Login
        </button>
        <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
          Get Started
        </button>
      </div>
    </header>
  );
}
