/**
 * Auth domain types
 *
 * Centralised types for auth state, session, and user profile.
 * Components and hooks import from here — not from AuthContext directly.
 */

export interface UserProfile {
  id: string;
  email: string;
  phoneNumber: string;
  country: string;
  kycStatus: "pending" | "verified" | "rejected";
  role: "USER" | "ADMIN" | "MERCHANT";
  supabaseUserId?: string;
  createdAt: Date;
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
}

export interface AuthContextData {
  // Session state
  session: SessionData | null;
  user: UserProfile | null;
  supabaseUser: import("@supabase/supabase-js").User | null;

  // Loading & error
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Utilities
  hasRole: (roles: string[]) => boolean;
  isSessionExpiringSoon: () => boolean;
}
