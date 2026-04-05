"use client";

import { useState, useEffect } from "react";
import { TenantSwitcher, TenantMembership } from "@/components/ui/TenantSwitcher";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isInitialized, isLoading: authLoading, session } = useAuth();
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized || authLoading) {
      return;
    }

    // Redirect if no session is found after initialization
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const fetchTenantData = async () => {
      try {
        const [membershipsRes] = await Promise.all([
          fetch("/api/tenant/memberships"),
        ]);

        // Read tenant cookie from browser
        const tenantCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("wedupay-tenant="))
          ?.split("=")[1] ?? null;

        if (membershipsRes.ok) {
          const data = await membershipsRes.json();
          if (data.success && data.memberships.length > 0) {
            setMemberships(data.memberships);
            const activeTenant =
              tenantCookie ??
              data.memberships.find((m: TenantMembership) => m.isDefault)?.tenantSlug ??
              data.memberships[0].tenantSlug;
            setCurrentTenant(activeTenant);
          }
        }
      } catch (error) {
        console.error("Failed to fetch tenant data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [isInitialized, authLoading, session, router]);



  // Show loading while auth or tenant data is loading
  if (!isInitialized || authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Logo + Tenant Switcher */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:brightness-110 transition">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">WeduPay</span>
            </Link>

            {memberships.length > 1 && (
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            )}

            <div className="max-w-xs">
              <TenantSwitcher memberships={memberships} currentTenantSlug={currentTenant} />
            </div>
          </div>


        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
