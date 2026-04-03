/**
 * Authentication Context Provider
 *
 * Provides authentication state and methods throughout the React component tree.
 * Wraps the app to make auth state accessible via useAuth hook.
 *
 * Features:
 * - Session management with automatic refresh
 * - Loading states during auth operations
 * - Protected route handling
 * - User profile caching
 *
 * @module contexts/AuthContext
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  supabase,
  getCurrentSession,
  signOutUser,
  SessionData,
  UserProfile,
  isSessionExpired,
} from '@/lib/auth-service';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Authentication context data structure
 * Contains all auth state and methods
 */
interface AuthContextData {
  // Session state
  session: SessionData | null;
  user: UserProfile | null;
  supabaseUser: SupabaseUser | null;

  // Loading and error states
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Auth methods
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Utility methods
  hasRole: (roles: string[]) => boolean;
  isSessionExpiringSoon: () => boolean;
}

/**
 * Auth context with default values
 * Used when context is accessed outside provider
 */
export const AuthContext = createContext<AuthContextData | null>(null);

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Session refresh interval (5 minutes)
 * Session is refreshed before expiry to maintain continuity
 */
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000;

/**
 * Authentication Provider Component
 *
 * Wraps the app and provides auth state to all child components.
 * Manages session lifecycle, auto-refresh, and auth state synchronization.
 *
 * @param props - Component props
 * @param props.children - Child components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  // Auth state
  const [session, setSession] = useState<SessionData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  /**
   * Initialize auth state on mount
   * Loads existing session and sets up auth listener
   */
  useEffect(() => {
    // Mark as client-side
    setIsClient(true);

    let sessionRefreshInterval: NodeJS.Timeout;

    /**
     * Initialize session
     * Loads current session and sets up periodic refresh
     */
    const initializeSession = async () => {
      try {
        console.log('[AuthContext] Initializing session...');
        setIsLoading(true);
        setError(null);

        const { session: currentSession, user: currentUser } = await getCurrentSession();

        if (currentSession && currentUser) {
          console.log('[AuthContext] Session loaded for user:', currentUser.email);
          setSession(currentSession);
          setUser(currentUser);

          // Get Supabase user details
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          setSupabaseUser(sbUser);

          // Set up periodic session refresh
          sessionRefreshInterval = setInterval(async () => {
            const { session: refreshedSession } = await getCurrentSession();
            if (refreshedSession) {
              setSession(refreshedSession);
            }
          }, SESSION_REFRESH_INTERVAL);
        } else {
          console.log('[AuthContext] No active session');
        }
      } catch (err) {
        console.error('[AuthContext] Session initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    /**
     * Auth state change listener
     * Handles login, logout, and token refresh events from Supabase
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);

        switch (event) {
          case 'SIGNED_IN':
            // User signed in - refresh all state
            const { user: profile } = await getCurrentSession();
            if (session && profile) {
              setSession({
                userId: session.user.id,
                email: session.user.email || '',
                role: profile.role,
                expiresAt: session.expires_at ? session.expires_at * 1000 : 0,
              });
              setUser(profile);
              setSupabaseUser(session.user);
            }
            break;

          case 'SIGNED_OUT':
            // User signed out - clear all state
            setSession(null);
            setUser(null);
            setSupabaseUser(null);
            break;

          case 'TOKEN_REFRESHED':
            // Token refreshed - update session
            if (session) {
              setSession(prev => prev ? ({
                ...prev,
                expiresAt: session.expires_at ? session.expires_at * 1000 : 0,
              }) : null);
            }
            break;

          case 'USER_UPDATED':
            // User profile updated - refresh from server
            const { user: updatedProfile } = await getCurrentSession();
            if (updatedProfile) {
              setUser(updatedProfile);
            }
            break;

          default:
            break;
        }
      }
    );

    // Initialize session
    initializeSession();

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval);
      }
    };
  }, []);

  /**
   * Refresh current session
   * Forces a session refresh with the server
   */
  const refreshSession = useCallback(async () => {
    try {
      console.log('[AuthContext] Refreshing session...');
      const { session: refreshedSession, user: refreshedUser } = await getCurrentSession();

      if (refreshedSession && refreshedUser) {
        setSession(refreshedSession);
        setUser(refreshedUser);
        setError(null);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      console.error('[AuthContext] Session refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh session');
    }
  }, []);

  /**
   * Log out current user
   * Clears session and redirects to login page
   */
  const logout = useCallback(async () => {
    try {
      console.log('[AuthContext] Logging out user...');
      const result = await signOutUser();

      if (result.success) {
        setSession(null);
        setUser(null);
        setSupabaseUser(null);
        
        // Redirect to login
        router.push('/auth/login');
      } else {
        setError(result.error || 'Logout failed');
      }
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  }, [router]);

  /**
   * Check if user has any of the specified roles
   * 
   * @param roles - Array of roles to check against
   * @returns Boolean indicating if user has any of the roles
   * 
   * @example
   * ```tsx
   * const { hasRole } = useAuth();
   * 
   * // Check for admin role
   * if (hasRole(['ADMIN'])) {
   *   return <AdminPanel />;
   * }
   * 
   * // Check for multiple roles
   * if (hasRole(['ADMIN', 'MERCHANT'])) {
   *   return <BusinessDashboard />;
   * }
   * ```
   */
  const hasRole = useCallback((roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user?.role]);

  /**
   * Check if session is expiring soon (within 10 minutes)
   * Used to trigger proactive session refresh
   * 
   * @returns Boolean indicating if session will expire soon
   */
  const isSessionExpiringSoon = useCallback((): boolean => {
    if (!session) return true;
    
    const expiryTime = session.expiresAt;
    const tenMinutesFromNow = Date.now() + (10 * 60 * 1000);
    
    return expiryTime < tenMinutesFromNow;
  }, [session]);

  /**
   * Context value with all auth state and methods
   */
  const contextValue: AuthContextData = {
    session,
    user,
    supabaseUser,
    isLoading,
    isInitialized,
    error,
    refreshSession,
    logout,
    hasRole,
    isSessionExpiringSoon,
  };

  // During SSR, render nothing to avoid context issues
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Authentication Hook
 * 
 * Provides access to authentication context from any component.
 * Must be used within an AuthProvider.
 * 
 * @returns AuthContextData - All auth state and methods
 * 
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * ```tsx
 * // Basic usage
 * function UserProfile() {
 *   const { user, isLoading, logout } = useAuth();
 *   
 *   if (isLoading) return <Spinner />;
 *   if (!user) return <LoginPrompt />;
 *   
 *   return (
 *     <div>
 *       <p>Email: {user.email}</p>
 *       <p>Country: {user.country}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * 
 * // Protected component
 * function AdminOnly() {
 *   const { user, hasRole, isLoading } = useAuth();
 *   
 *   if (isLoading) return <Spinner />;
 *   if (!hasRole(['ADMIN'])) return <AccessDenied />;
 *   
 *   return <AdminDashboard />;
 * }
 * ```
 */
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Higher-Order Component for Protected Routes
 * 
 * Wraps a component and redirects to login if not authenticated.
 * Optionally checks for specific roles.
 * 
 * @param WrappedComponent - Component to protect
 * @param options - Protection options
 * @param options.roles - Required roles (optional)
 * @param options.redirectTo - Redirect path if not authorized (default: /auth/login)
 * 
 * @returns Protected component
 * 
 * @example
 * ```tsx
 * // Protect a page with authentication
 * const ProtectedDashboard = withAuth(Dashboard);
 * 
 * // Protect with role requirement
 * const AdminPage = withAuth(AdminDashboard, { roles: ['ADMIN'] });
 * 
 * // Custom redirect
 * const MerchantPage = withAuth(MerchantDashboard, { 
 *   roles: ['MERCHANT'],
 *   redirectTo: '/auth/merchant-login'
 * });
 * ```
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    roles?: string[];
    redirectTo?: string;
  } = {}
): React.ComponentType<P> {
  const { roles, redirectTo = '/auth/login' } = options;

  return function AuthProtectedComponent(props: P) {
    const { user, hasRole, isLoading, isInitialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (isInitialized && !isLoading) {
        // Check authentication
        if (!user) {
          router.replace(redirectTo);
          return;
        }

        // Check roles if specified
        if (roles && !hasRole(roles)) {
          router.replace('/unauthorized');
          return;
        }
      }
    }, [user, isLoading, isInitialized, roles, hasRole, router, redirectTo]);

    // Show loading while checking auth
    if (isLoading || !isInitialized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      );
    }

    // Don't render if not authorized
    if (!user || (roles && !hasRole(roles))) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

export default AuthContext;
