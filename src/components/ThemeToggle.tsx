"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-primary/20 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-xl">progress_activity</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-primary/20 flex items-center justify-center text-slate-500 hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-primary/10"
      aria-label="Toggle Dark Mode"
    >
      <span className="material-symbols-outlined text-xl">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
