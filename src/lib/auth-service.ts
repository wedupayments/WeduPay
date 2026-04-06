/**
 * Authentication Service
 * 
 * Handles user authentication, session management, and profile operations
 * using Supabase Auth with JWT tokens.
 * 
 * @module services/auth
 */

import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

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
 * Session persistence is disabled - we handle it server-side via cookies
 */
export const supabase = isValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Don't persist in localStorage - use server cookies
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
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

async function persistServerSession(session: Session): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      return {
        success: false,
        error: result?.error || 'Failed to persist server session',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to persist server session',
    };
  }
}

export async function clearServerSession(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      return {
        success: false,
        error: result?.error || 'Failed to clear server session',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear server session',
    };
  }
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

function getDemoProfileDefaults(email: string): { phoneNumber: string; country: string } | null {
  const demoProfiles: Record<string, { phoneNumber: string; country: string }> = {
    'customer@wedupay.test': { phoneNumber: '+263771234567', country: 'ZW' },
    'merchant@wedupay.test': { phoneNumber: '+2348012345678', country: 'NG' },
    'admin@wedupay.test': { phoneNumber: '+263772000000', country: 'ZW' },
    'wedupay@gmail.com': { phoneNumber: '+263771234567', country: 'ZW' },
  };

  return demoProfiles[email] ?? null;
}

function getProfileSeedData(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): { email: string; phoneNumber?: string; country?: string } | null {
  const email = user.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const metadata = user.user_metadata ?? {};
  const demoDefaults = getDemoProfileDefaults(email);
  const phoneNumber =
    typeof metadata.phone_number === 'string' && metadata.phone_number.trim()
      ? metadata.phone_number
      : demoDefaults?.phoneNumber;
  const country =
    typeof metadata.country === 'string' && metadata.country.trim()
      ? metadata.country
      : demoDefaults?.country;

  return { email, phoneNumber, country };
}

export function getDashboardPathForUser(user: Pick<UserProfile, 'role' | 'email'>): string {
  if (user.role === 'ADMIN') {
    return '/dashboard/admin';
  }

  if (user.role === 'MERCHANT' || user.email === 'merchant@wedupay.test') {
    return '/dashboard/merchant';
  }

  return '/dashboard/customer';
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
  role,
}: {
  email: string;
  password: string;
  phoneNumber: string;
  country: string;
  role?: string;
}): Promise<AuthResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Validate input - ALL fields are required
    if (!normalizedEmail || !password || !phoneNumber || !country) {
      return {
        success: false,
        error: 'All fields are required: email, password, phone number, and country',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Validate password strength (min 8 chars, at least 1 number)
    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long',
      };
    }
    
    if (!/\d/.test(password)) {
      return {
        success: false,
        error: 'Password must contain at least 1 number',
      };
    }

    // Validate and normalize phone number (international format)
    const phoneRegex = /^\+?[1-9]\d{8,14}$/;
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return {
        success: false,
        error: 'Invalid phone number. Use international format (e.g., +263771234567)',
      };
    }

    // Validate country code (must be 2 letters)
    const cleanCountry = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cleanCountry)) {
      return {
        success: false,
        error: 'Invalid country code. Use 2-letter ISO code (e.g., ZW, KE, NG)',
      };
    }

    console.log('[registerUser] Registering user:', {
      email: normalizedEmail,
      phone: cleanPhone,
      country: cleanCountry,
    });

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          phone_number: cleanPhone,
          country: cleanCountry,
        },
      },
    });

    if (authError) {
      console.error('[registerUser] Supabase auth error:', authError);
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }

    console.log('[registerUser] Supabase user created:', authData.user.id);

    // Check if email confirmation is required
    const requiresConfirmation = !authData.session;

    // Create user profile in database via API
    console.log('[registerUser] Creating user profile...');
    const profileResult = await createUserProfile({
      supabaseUserId: authData.user.id,
      email: normalizedEmail,
      phoneNumber: cleanPhone,
      country: cleanCountry,
      role,
    });

    if (!profileResult.success) {
      console.error('[registerUser] Profile creation failed:', profileResult.error);
      
      // Clean up Supabase user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('[registerUser] Failed to cleanup Supabase user:', cleanupError);
      }
      
      return {
        success: false,
        error: profileResult.error || 'Failed to create user profile',
      };
    }

    console.log('[registerUser] Profile created successfully');

    // Persist session if available
    if (authData.session) {
      const sessionResult = await persistServerSession(authData.session);
      if (!sessionResult.success) {
        console.error('[registerUser] Session persistence failed:', sessionResult.error);
        return {
          success: false,
          error: sessionResult.error || 'Failed to establish session',
        };
      }
    }

    return {
      success: true,
      user: profileResult.user,
      requiresConfirmation,
    };
  } catch (error) {
    console.error('[registerUser] Unexpected error:', error);
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

    // Validate input
    if (!normalizedEmail || !password) {
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
      password,
    });

    if (authError) {
      // Map common auth errors to user-friendly messages
      if (authError.message.includes('Invalid login credentials')) {
        if (normalizedEmail.endsWith('@wedupay.test')) {
          return {
            success: false,
            error:
              'This demo account exists in the app seed data, but no matching Supabase login was found. Register the demo email first or disable demo account buttons.',
          };
        }

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

    // Get or backfill user profile from database
    const profile = await ensureUserProfile(authData.user);

    if (!profile) {
      // Check if this is a case where profile creation failed due to missing data
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        // User is authenticated but profile creation failed
        // Keep them signed in and redirect to profile completion
        console.log('[signInUser] Profile creation failed, user needs to complete profile');
        
        if (authData.session) {
          await persistServerSession(authData.session);
        }
        
        return {
          success: true,
          user: undefined,
          error: 'PROFILE_INCOMPLETE',
        };
      }
      
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          'Your sign-in succeeded, but WeduPay could not load or create your app profile. Complete registration first, or contact support if this account should already exist.',
      };
    }

    if (authData.session) {
      const sessionResult = await persistServerSession(authData.session);
      if (!sessionResult.success) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: sessionResult.error || 'Your account was verified, but WeduPay could not establish a secure session.',
        };
      }
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
    const [{ error }, clearResult] = await Promise.all([
      supabase.auth.signOut(),
      clearServerSession(),
    ]);

    if (error || !clearResult.success) {
      return {
        success: false,
        error: error?.message || clearResult.error || 'Sign out failed',
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
    // 1. Try browser-side memory (short-lived due to persistSession: false)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (session) {
      const userProfile = await ensureUserProfile(session.user);
      if (userProfile) {
        return {
          session: {
            userId: session.user.id,
            email: session.user.email || '',
            role: userProfile.role,
            expiresAt: session.expires_at ? session.expires_at * 1000 : 0,
          },
          user: userProfile,
          isLoading: false,
        };
      }
    }

    // 2. Fallback to server session (via httpOnly cookies)
    // Only attempt on client-side
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Profile details from API
            const profile = await getUserProfile(data.user.id);
            if (profile) {
              return {
                session: {
                  ...data.session,
                  role: profile.role,
                },
                user: profile,
                isLoading: false,
              };
            }
          }
        }
      } catch (fetchErr) {
        console.error('[AuthService] Failed to fetch server session:', fetchErr);
      }
    }

    return {
      session: null,
      user: null,
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
  phoneNumber?: string;
  country?: string;
  role?: string;
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
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    const headers: HeadersInit = {};

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`/api/auth/user?userId=${supabaseUserId}`, { headers });

    if (!response.ok) {
      console.log('[getUserProfile] Profile not found for Supabase user:', supabaseUserId);
      return null;
    }

    const result = await response.json();
    return result.user;
  } catch (error) {
    console.error('[getUserProfile] Error fetching profile:', error);
    return null;
  }
}

async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    const headers: HeadersInit = {};

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`/api/auth/user?email=${encodeURIComponent(email)}`, { headers });

    if (!response.ok) {
      console.log('[getUserProfileByEmail] Profile not found for email:', email);
      return null;
    }

    const result = await response.json();
    return result.user;
  } catch (error) {
    console.error('[getUserProfileByEmail] Error fetching profile:', error);
    return null;
  }
}

/**
 * Ensure user has a profile in the database
 * 
 * This function is called after Supabase authentication to ensure
 * the user has a corresponding profile in our database.
 * 
 * Flow:
 * 1. Check if profile exists by Supabase user ID
 * 2. If not, check if profile exists by email (for linking)
 * 3. If email profile exists, link it to Supabase user
 * 4. If no profile exists, try to create one with available data
 * 5. If data is missing, return null (caller should redirect to profile completion)
 * 
 * @param user - Supabase user object
 * @returns UserProfile if successful, null if profile needs to be completed
 */
async function ensureUserProfile(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<UserProfile | null> {
  const email = user.email?.toLowerCase();
  
  if (!email) {
    console.error('[ensureUserProfile] No email provided');
    return null;
  }

  // 1. Check if profile already exists by Supabase user ID
  const existingProfile = await getUserProfile(user.id);
  if (existingProfile) {
    console.log('[ensureUserProfile] Profile found by Supabase ID:', email);
    return existingProfile;
  }

  // 2. Check if profile exists by email (needs linking)
  const emailProfile = await getUserProfileByEmail(email);
  if (emailProfile) {
    console.log('[ensureUserProfile] Found profile by email, attempting to link:', email);
    
    // Link the profile by updating it with Supabase user ID
    const linkResult = await createUserProfile({
      supabaseUserId: user.id,
      email,
      // These will be ignored since profile exists, but required by schema
      phoneNumber: emailProfile.phoneNumber,
      country: emailProfile.country,
    });
    
    if (linkResult.success && linkResult.user) {
      console.log('[ensureUserProfile] Successfully linked profile:', email);
      return linkResult.user;
    }
    
    console.error('[ensureUserProfile] Failed to link profile:', linkResult.error);
    return null;
  }

  // 3. Try to get profile data from user metadata or demo defaults
  const seedData = getProfileSeedData(user);
  if (!seedData) {
    console.error('[ensureUserProfile] No seed data available for:', email);
    return null;
  }

  // 4. Check if we have complete data to create profile
  if (!seedData.phoneNumber || !seedData.country) {
    console.log('[ensureUserProfile] Incomplete data for new profile:', email, {
      hasPhone: !!seedData.phoneNumber,
      hasCountry: !!seedData.country,
    });
    return null; // Caller should redirect to profile completion
  }

  // 5. Create new profile with complete data
  console.log('[ensureUserProfile] Creating new profile for:', email);
  const profileResult = await createUserProfile({
    supabaseUserId: user.id,
    email: seedData.email,
    phoneNumber: seedData.phoneNumber,
    country: seedData.country,
  });

  if (!profileResult.success) {
    console.error('[ensureUserProfile] Failed to create profile:', profileResult.error);
    return null;
  }

  console.log('[ensureUserProfile] Successfully created profile:', email);
  return profileResult.user ?? null;
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
export async function sendPasswordReset(email: string, tenantSlug?: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return {
        success: false,
        error: 'Email address is required',
      };
    }

    const resetPath = tenantSlug
      ? `/t/${tenantSlug}/auth/reset-password?tenant=${tenantSlug}`
      : '/auth/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}${resetPath}`,
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

    const persistResult = await persistServerSession(session);
    if (!persistResult.success) {
      return {
        success: false,
        error: persistResult.error || 'Failed to refresh secure session',
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

export { persistServerSession };
