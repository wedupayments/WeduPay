'use client';

/**
 * useAuth hook
 *
 * Extracted from AuthContext.tsx to follow the CLAUDE.md rule:
 * "Extract reusable logic into custom hooks."
 *
 * Import this hook anywhere you need auth state.
 * The AuthProvider must be an ancestor in the tree.
 */

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import type { AuthContextData } from "@/features/auth/types/auth.types";

const SAFE_DEFAULT: AuthContextData = {
  session: null,
  user: null,
  supabaseUser: null,
  isLoading: true,
  isInitialized: false,
  error: null,
  refreshSession: async () => {},
  logout: async () => {},
  hasRole: () => false,
  isSessionExpiringSoon: () => false,
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  // Return safe defaults during SSR or when used outside provider
  if (context === null || context === undefined) {
    return SAFE_DEFAULT;
  }
  return context as AuthContextData;
}
