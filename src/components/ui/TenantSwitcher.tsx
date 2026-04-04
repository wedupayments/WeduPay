"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { buildTenantPath } from "@/lib/tenant";

export interface TenantMembership {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  role: string;
  isDefault: boolean;
}

interface TenantSwitcherProps {
  memberships: TenantMembership[];
  currentTenantSlug: string | null;
}

export function TenantSwitcher({ memberships, currentTenantSlug }: TenantSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeMembership = memberships.find(
    (m) => m.tenantSlug === currentTenantSlug
  ) ?? memberships.find((m) => m.isDefault) ?? memberships[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchTenant = (tenantSlug: string) => {
    // Switch to the tenant's dashboard (preserve current path)
    const currentPath = window.location.pathname;
    // Strip any existing tenant prefix
    const strippedPath = currentPath.replace(/^\/t\/[^/]+(?=\/|$)/, "") || "/dashboard";
    const newPath = buildTenantPath(strippedPath, tenantSlug);

    // Set tenant cookie via fetch to backend
    fetch("/api/tenant/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantSlug }),
    }).then(() => {
      router.push(newPath);
      router.refresh();
    });

    setIsOpen(false);
  };

  if (!memberships.length || memberships.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-base">account_balance</span>
        <span className="truncate flex-1 text-left">{activeMembership?.tenantName ?? "Select workspace"}</span>
        <span className={`material-symbols-outlined text-sm transition-transform ${isOpen ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
          role="listbox"
        >
          <div className="py-1 max-h-64 overflow-y-auto">
            {memberships.map((membership) => (
              <button
                key={membership.tenantId}
                onClick={() => handleSwitchTenant(membership.tenantSlug)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  membership.tenantSlug === currentTenantSlug
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                role="option"
                aria-selected={membership.tenantSlug === currentTenantSlug}
              >
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{membership.tenantName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {membership.role}
                    {membership.isDefault ? " · Default" : ""}
                  </p>
                </div>
                {membership.tenantSlug === currentTenantSlug && (
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
