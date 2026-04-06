'use client';

/**
 * useAuthenticatedFetch
 *
 * Moved from src/hooks/ → src/shared/hooks/ to follow the CLAUDE.md
 * shared/ convention for domain-agnostic reusable utilities.
 *
 * The original path src/hooks/useAuthenticatedFetch.ts re-exports this
 * file for backward compatibility.
 */

import { useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface AuthenticatedFetchResult {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  isReady: boolean;
}

export function useAuthenticatedFetch(): AuthenticatedFetchResult {
  const { isInitialized, isLoading, session } = useAuth();

  const authenticatedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (!isInitialized || isLoading) {
        throw new Error("Authentication not initialized");
      }
      if (!session) {
        throw new Error("Not authenticated");
      }
      return fetch(input, { ...init, credentials: "same-origin" });
    },
    [isInitialized, isLoading, session]
  );

  return {
    fetch: authenticatedFetch,
    isReady: isInitialized && !isLoading && !!session,
  };
}
