"use client";

import { Sidebar } from "@/components/Sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/dashboard/admin");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark/50">
      {isAdmin ? <AdminSidebar /> : <Sidebar />}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {children}
      </div>
      
      {/* Mobile Bottom Bar (optional but good for consistency) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-primary/10 flex justify-around p-3 z-50">
        <button className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[10px] font-bold">Payments</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-bold">History</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
}
