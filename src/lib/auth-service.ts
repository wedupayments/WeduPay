/**
 * Authentication Service
 * 
 * Handles user authentication, session management, and profile operations
 * using Supabase Auth with JWT tokens.
 * 
 * @module services/auth
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client instance
 * Initialized with environment variables for URL and anon key
 */
// Use environment variables with fallback to empty strings for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Validate configuration
const isValidConfig = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.includes("supabase.co");

/**
 * Client-side Supabase instance (for browser)
 * Uses anon key with RLS policies enforced
 */
export const supabase = isValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

/**
 * Server-side Supabase instance (for API routes)
 * Uses service role key - bypasses RLS (use with caution!)
 */
export const supabaseAdmin = isValidConfig && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

/**
 * User profile data structure
 * Matches the User model in database
 */
export interface UserProfile {
  id: string;
  email: string;
  phoneNumber: string;
  country: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  role: 'USER' | 'ADMIN' | 'MERCHANT';
  supabaseUserId?: string;
  createdAt: Date;
}

/**
 * Authentication result from sign in/up operations
 */
export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  requiresConfirmation?: boolean;
}

/**
 * Session data structure
 */
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
}

/**
 * ============================
 * AUTHENTICATION FUNCTIONS
 * ============================
 */

/**
 * Register a new user account
 * 
 * Creates user in Supabase Auth and creates profile in database
 * 
 * @param email - User's email address
 * @param password - User's password (min 8 chars)
 * @param phoneNumber - User's phone number with country code
 * @param country - User's country code (e.g., 'KE', 'NG')
 * @returns AuthResult with user data or error
 * 
 * @example
 * ```typescript
 * const result = await registerUser({
 *   email: 'user@example.com',
 *   password: 'securepassword123',
 *   phoneNumber: '254712345678',
 *   country: 'KE'
 * });
 * 
 * if (result.success) {
 *   // User created successfully
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function registerUser({
  email,
  password,
  phoneNumber,
  country,
}: {
  email: string;
  password: string;
  phoneNumber: string;
  country: string;
}): Promise<AuthResult> {
  try {
    // Validate input
    if (!email || !password || !phoneNumber || !country) {
      return {
        success: false,
        error: 'All fields are required',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Validate password strength (min 8 chars, at least 1 number)
    if (password.length < 8 || !/\d/.test(password)) {
      return {
        success: false,
        error: 'Password must be at least 8 characters with 1 number',
      };
    }

    // Validate phone number (basic check for international format)
    const phoneRegex = /^\+?[1-9]\d{8,14}$/;
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return {
        success: false,
        error: 'Invalid phone number. Use international format (e.g., +254712345678)',
      };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone_number: cleanPhone,
          country,
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user',
      };
    }

    // Check if email confirmation is required
    const requiresConfirmation = !!authData.user.identities?.length;

    // Create user profile in database via API
    const profileResult = await createUserProfile({
      supabaseUserId: authData.user.id,
      email,
      phoneNumber: cleanPhone,
      country,
    });

    if (!profileResult.success) {
      // Auth succeeded but profile failed - clean up
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: profileResult.error || 'Failed to create profile',
      };
    }

    return {
      success: true,
      user: profileResult.user,
      requiresConfirmation,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

/**
 * Sign in an existing user
 * 
 * Authenticates user with email/password and returns session
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns AuthResult with user data or error
 * 
 * @example
 * ```typescript
 * const result = await signInUser({
 *   email: 'user@example.com',
 *   password: 'securepassword123'
 * });
 * 
 * if (result.success) {
 *   // User authenticated successfully
 *   const session = await getSession();
 * }
 * ```
 */
export async function signInUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // Validate input
    if (!normalizedEmail || !normalizedPassword) {
      return {
        success: false,
        error: 'Email and password are required',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return {
        success: false,
        error: 'Enter a valid email address',
      };
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (authError) {
      // Map common auth errors to user-friendly messages
      if (authError.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }
      if (authError.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please verify your email address',
          requiresConfirmation: true,
        };
      }
      if (authError.message.includes('Email logins are disabled')) {
        return {
          success: false,
          error: 'Email/password sign-in is disabled in Supabase for this project.',
        };
      }
      if (authError.message.includes('Password should be at least')) {
        return {
          success: false,
          error: 'Your password format was rejected. Please re-enter it and try again.',
        };
      }
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    // Get user profile from database
    const profile = await getUserProfile(authData.user.id);

    if (!profile) {
      // User exists in auth but not in database - create profile
      const profileResult = await createUserProfile({
        supabaseUserId: authData.user.id,
        email: authData.user.email!,
        phoneNumber: authData.user.user_metadata?.phone_number || '',
        country: authData.user.user_metadata?.country || 'KE',
      });

      if (!profileResult.success) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Failed to load user profile',
        };
      }

      return {
        success: true,
        user: profileResult.user,
      };
    }

    return {
      success: true,
      user: profile,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign in failed',
    };
  }
}

/**
 * Sign out the current user
 * 
 * Clears session and invalidates tokens
 * 
 * @returns Object with success status and error if any
 * 
 * @example
 * ```typescript
 * const result = await signOutUser();
 * if (result.success) {
 *   // Redirect to login
 *   router.push('/auth/login');
 * }
 * ```
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed',
    };
  }
}

/**
 * Get current session and user
 * 
 * Retrieves the active session and associated user profile
 * 
 * @returns Object with session, user, and loading state
 * 
 * @example
 * ```typescript
 * const { session, user, isLoading } = await getCurrentSession();
 * 
 * if (session && user) {
 *   // User is authenticated
 *   console.log(`Welcome, ${user.email}`);
 * } else if (!isLoading) {
 *   // No session - redirect to login
 *   router.push('/auth/login');
 * }
 * ```
 */
export async function getCurrentSession(): Promise<{
  session: SessionData | null;
  user: UserProfile | null;
  isLoading: boolean;
}> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return {
        session: null,
        user: null,
        isLoading: false,
      };
    }

    const user = await getUserProfile(session.user.id);

    if (!user) {
      return {
        session: null,
        user: null,
        isLoading: false,
      };
    }

    return {
      session: {
        userId: session.user.id,
        email: session.user.email || '',
        role: user.role,
        expiresAt: session.expires_at ? session.expires_at * 1000 : 0,
      },
      user,
      isLoading: false,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      session: null,
      user: null,
      isLoading: false,
    };
  }
}

/**
 * ============================
 * USER PROFILE FUNCTIONS
 * ============================
 */

/**
 * Create user profile in database
 * 
 * Called after successful auth registration
 * 
 * @param data - User profile data
 * @returns Result with user data or error
 * 
 * @internal
 */
async function createUserProfile(data: {
  supabaseUserId: string;
  email: string;
  phoneNumber: string;
  country: string;
}): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const response = await fetch('/api/auth/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to create profile',
      };
    }

    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    console.error('Create profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get user profile by Supabase user ID
 * 
 * @param supabaseUserId - Supabase auth user ID
 * @returns User profile or null if not found
 * 
 * @internal
 */
async function getUserProfile(supabaseUserId: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`/api/auth/user?userId=${supabaseUserId}`);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.user;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

/**
 * Update user profile
 * 
 * Updates phone, country, or other profile fields
 * 
 * @param userId - User ID
 * @param data - Fields to update
 * @returns Result with success status
 * 
 * @example
 * ```typescript
 * const result = await updateUserProfile(userId, {
 *   phoneNumber: '254712345678',
 *   country: 'KE'
 * });
 * ```
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<{
    phoneNumber: string;
    country: string;
    kycStatus: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to update profile',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * ============================
 * PASSWORD MANAGEMENT
 * ============================
 */

/**
 * Send password reset email
 * 
 * @param email - User's email address
 * @returns Result with success status
 * 
 * @example
 * ```typescript
 * const result = await sendPasswordReset('user@example.com');
 * if (result.success) {
 *   // Check email for reset link
 * }
 * ```
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return {
        success: false,
        error: 'Email address is required',
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reset email',
    };
  }
}

/**
 * Update user password
 * 
 * Requires user to be authenticated
 * 
 * @param newPassword - New password (min 8 chars)
 * @returns Result with success status
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate password
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      return {
        success: false,
        error: 'Password must be at least 8 characters with 1 number',
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password',
    };
  }
}

/**
 * ============================
 * SESSION UTILITIES
 * ============================
 */

/**
 * Check if current session is expired
 * 
 * @param session - Session data to check
 * @returns Boolean indicating if session is expired
 */
export function isSessionExpired(session: SessionData): boolean {
  return Date.now() >= session.expiresAt;
}

/**
 * Get time until session expires (in minutes)
 * 
 * @param session - Session data
 * @returns Minutes until expiration
 */
export function getSessionExpiryMinutes(session: SessionData): number {
  const now = Date.now();
  const expiresAt = session.expiresAt;
  return Math.max(0, Math.floor((expiresAt - now) / 1000 / 60));
}

/**
 * Refresh current session
 * 
 * Extends session expiry time
 * 
 * @returns Result with new session or error
 */
export async function refreshSession(): Promise<{ success: boolean; session?: SessionData; error?: string }> {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error || !session) {
      return {
        success: false,
        error: error?.message || 'Failed to refresh session',
      };
    }

    return {
      success: true,
      session: {
        userId: session.user.id,
        email: session.user.email || '',
        role: 'USER', // Would need to fetch from profile
        expiresAt: session.expires_at ? session.expires_at * 1000 : 0,
      },
    };
  } catch (error) {
    console.error('Refresh session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh session',
    };
  }
}
