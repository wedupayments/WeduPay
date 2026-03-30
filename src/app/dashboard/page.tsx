"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to customer dashboard by default
    router.push("/dashboard/customer");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
        <p className="text-slate-600 dark:text-slate-400 mt-4">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
