/**
 * Login Page
 *
 * User authentication page with email/password login.
 * Supports redirect after successful login and password reset flow.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInUser, getCurrentSession, getDashboardPathForUser } from '@/lib/auth-service';

const TEST_ACCOUNTS = [
  { label: 'Customer', email: 'customer@wedupay.test', password: 'password123' },
  { label: 'Merchant', email: 'merchant@wedupay.test', password: 'password123' },
  { label: 'Admin', email: 'admin@wedupay.test', password: 'password123' },
];

/**
 * Login form component with search params access
 * Wrapped in Suspense boundary in parent component
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect');

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { session, user } = await getCurrentSession();
        if (session && user) {
          setIsLoggedIn(true);
          router.push(redirectTo || getDashboardPathForUser(user));
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [router, redirectTo]);

  /**
   * Handle form submission
   * Authenticates user and redirects on success
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // Attempt sign in
      const result = await signInUser({ email, password });

      if (result.success) {
        setSuccessMessage('Login successful! Redirecting...');

        document.cookie = `wedupay-user-id=${encodeURIComponent(result.user!.id)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax; SameSite=Lax`;
        document.cookie = `wedupay-user-email=${encodeURIComponent(result.user!.email)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax; SameSite=Lax`;
        document.cookie = `wedupay-user-role=${encodeURIComponent(result.user!.role)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax; SameSite=Lax`;
        
        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to intended page
        router.push(redirectTo || getDashboardPathForUser(result.user!));
      } else {
        // Handle specific error cases
        if (result.requiresConfirmation) {
          setError('Please verify your email address. Check your inbox for the confirmation link.');
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle demo login (for testing)
   * Fills form with test credentials
   */
  const handleDemoLogin = (account: typeof TEST_ACCOUNTS[number]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="size-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white">payments</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WeduPay</h1>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Send money across Africa securely
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 mr-2">
                  error
                </span>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 mr-2">
                  check_circle
                </span>
                <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Demo Login (for testing) */}
          <div className="mt-6">
            <p className="mb-3 text-center text-sm text-gray-600 dark:text-gray-400">
              Test accounts
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          {' | '}
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Login page with Suspense boundary for useSearchParams
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
