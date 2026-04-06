/**
 * Auth sub-module barrel
 *
 * Re-exports from the auth helpers. Consumers can import from here
 * or from "@/lib/auth/auth" / "@/lib/auth/auth-service" directly.
 *
 * Server-side auth (authenticateRequest, requireAuth) lives in auth.ts.
 * Client-side session helpers (signInUser, registerUser, etc.) live in auth-service.ts.
 *
 * Note: supabase-server.ts uses the service role key — never import it in
 * client components. The supabase.ts browser client is safe on the client.
 */

export type { AuthResult } from "@/lib/auth";
export {
  authenticateRequest,
  requireAuth,
  requireAppUser,
  requirePermission,
  requireTenantAccess,
} from "@/lib/auth";

export type {
  UserProfile,
  SessionData,
  AuthResult as ClientAuthResult,
} from "@/lib/auth-service";
export {
  supabase,
  signInUser,
  signOutUser,
  registerUser,
  getCurrentSession,
  updateUserProfile,
  sendPasswordReset,
  updatePassword,
  refreshSession,
  isSessionExpired,
  getSessionExpiryMinutes,
  getDashboardPathForUser,
  persistServerSession,
  clearServerSession,
} from "@/lib/auth-service";
