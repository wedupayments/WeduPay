import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  title: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 dark:border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-slate-600 dark:text-slate-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/5 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-600 dark:text-slate-400 relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white dark:border-background-dark animate-pulse"></span>
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-600 dark:text-slate-400 hidden sm:block">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>
    </header>
  );
}
