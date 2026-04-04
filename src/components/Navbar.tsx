"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <header className="relative flex items-center justify-between border-b border-slate-200 dark:border-primary/20 px-4 py-3 md:py-4 lg:px-20 sticky top-0 z-[100] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 md:gap-3">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <Image
            src="/logo.svg"
            alt="WeduPay"
            width={164}
            height={48}
            priority
            className="h-9 w-auto md:h-10"
          />
        </Link>
      </div>

      {/* Mobile menu toggle */}
      <button
        type="button"
        className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="material-symbols-outlined text-2xl">
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
        <div 
          ref={menuRef}
          className="absolute top-full left-0 right-0 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-primary/20 shadow-xl md:hidden animate-in slide-in-from-top-2 duration-200"
        >
          <nav className="flex flex-col p-4 gap-1">
            <Link 
              className="text-base font-medium text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors p-3 min-h-[48px] flex items-center rounded-lg" 
              href="#benefits"
              onClick={() => setIsMenuOpen(false)}
            >
              Benefits
            </Link>
            <Link 
              className="text-base font-medium text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors p-3 min-h-[48px] flex items-center rounded-lg" 
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link 
              className="text-base font-medium text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors p-3 min-h-[48px] flex items-center rounded-lg" 
              href="#cta"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </nav>
          <div className="flex flex-col gap-3 p-4 border-t border-slate-200 dark:border-primary/20">
            <ThemeToggle />
            <Link 
              href="/auth/login" 
              className="flex items-center justify-center rounded-lg h-12 px-4 bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-primary text-base font-semibold hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
            <Link 
              href="/auth/register" 
              className="flex items-center justify-center rounded-lg h-12 px-4 bg-primary text-background-dark text-base font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
