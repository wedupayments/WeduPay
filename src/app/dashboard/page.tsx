"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDashboardPathForUser } from "@/lib/auth-service";
import { useAuth } from "@/shared/auth/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized || isLoading) {
      return;
    }

    // Redirect based on auth state
    if (user) {
      const dashboardPath = getDashboardPathForUser(user);
      console.log('[Dashboard] Redirecting to:', dashboardPath);
      router.push(dashboardPath);
    } else {
      console.log('[Dashboard] No user, redirecting to login');
      router.push("/auth/login?redirect=/dashboard");
    }
  }, [user, isLoading, isInitialized, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
        <p className="text-slate-600 dark:text-slate-400 mt-4">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
