'use client';

/**
 * useCustomerDashboard
 *
 * Extracts data fetching from the customer dashboard page.
 * Follows CLAUDE.md: "avoid business logic leaking into components — push it into hooks."
 */

import { useState, useEffect } from "react";
import type { CustomerDashboardData } from "../types/dashboard.types";

interface UseDashboardResult {
  data: CustomerDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCustomerDashboard(): UseDashboardResult {
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch("/api/dashboard/customer", { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json() as Promise<CustomerDashboardData>;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load dashboard data"
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchTrigger]);

  return { data, isLoading, error, refetch: () => setFetchTrigger((n) => n + 1) };
}
