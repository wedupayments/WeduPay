"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/auth/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isInitialized, isLoading: authLoading, session } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized || authLoading) {
      return;
    }

    // Redirect if no session is found after initialization
    if (!session) {
      router.push("/auth/login");
    }
  }, [isInitialized, authLoading, session, router]);



  // Show loading while auth or tenant data is loading
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
