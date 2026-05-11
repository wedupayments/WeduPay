'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInUser, getDashboardPathForUser } from '@/lib/auth-service';
import { useAuth } from '@/shared/auth/AuthContext';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { buildTenantPath } from '@/lib/tenant';

const TEST_ACCOUNTS = [
  {
    label: 'Customer',
    email: process.env.NEXT_PUBLIC_DEMO_CUSTOMER_EMAIL || '',
    password: process.env.NEXT_PUBLIC_DEMO_ACCOUNT_PASSWORD || '',
  },
  {
    label: 'Merchant',
    email: process.env.NEXT_PUBLIC_DEMO_MERCHANT_EMAIL || '',
    password: process.env.NEXT_PUBLIC_DEMO_ACCOUNT_PASSWORD || '',
  },
  {
    label: 'Admin',
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || '',
    password: process.env.NEXT_PUBLIC_DEMO_ACCOUNT_PASSWORD || '',
  },
].filter((account) => account.email && account.password);
const showDemoAccounts = process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'true';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, user, isLoading: authLoading, isInitialized } = useAuth();

  const tenantSlug = searchParams.get('tenant') ?? null;
  const redirectTo = searchParams.get('redirect');

  const backHref = tenantSlug ? buildTenantPath('/', tenantSlug) : '/';
  const registerHref = tenantSlug ? buildTenantPath('/auth/register', tenantSlug) : '/auth/register';
  const forgotHref = tenantSlug ? buildTenantPath('/auth/forgot-password', tenantSlug) : '/auth/forgot-password';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && !authLoading && session && user) {
      console.log('[Login] User authenticated, redirecting...', { user: user.email, session });
      const target = redirectTo || getDashboardPathForUser(user);
      const redirectUrl = tenantSlug ? buildTenantPath(target, tenantSlug) : target;
      console.log('[Login] Redirect URL:', redirectUrl);
      router.replace(redirectUrl);
    }
  }, [isInitialized, authLoading, session, user, redirectTo, tenantSlug, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const result = await signInUser({ email, password });

      if (result.success) {
        // Check if profile is incomplete
        if (result.error === 'PROFILE_INCOMPLETE') {
          console.log('[Login] Profile incomplete, redirecting to complete profile');
          router.push('/auth/complete-profile');
          return;
        }
        
        setSuccessMessage('Login successful! Redirecting...');
        // Don't redirect here - let the AuthContext useEffect handle it
        // after the session state is properly updated
      } else {
        if (result.requiresConfirmation) {
          setError('Please verify your email address. Check your inbox for the confirmation link.');
        } else {
          setError(result.error || 'Invalid email or password.');
        }
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (account: typeof TEST_ACCOUNTS[number]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  // Show spinner while auth context initializes
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Already authenticated — spinner before redirect kicks in
  if (session && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Sign in to your account"
      description={tenantSlug ? `Access ${tenantSlug}'s workspace` : 'Send money across Africa securely'}
      backHref={backHref}
      backLabel={tenantSlug ? `Back to ${tenantSlug}` : 'Back to home'}
      footer={
        <>
          <Link href={tenantSlug ? buildTenantPath('/terms', tenantSlug) : '/terms'} className="hover:underline">Terms of Service</Link>
          {' | '}
          <Link href={tenantSlug ? buildTenantPath('/privacy', tenantSlug) : '/privacy'} className="hover:underline">Privacy Policy</Link>
        </>
      }
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start">
            <span className="material-symbols-outlined mr-2 text-red-600 dark:text-red-400">error</span>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start">
            <span className="material-symbols-outlined mr-2 text-green-600 dark:text-green-400">check_circle</span>
            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full rounded-lg border border-slate-300 px-4 py-3 placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="you@example.com"
          />
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="appearance-none block w-full rounded-lg border border-slate-300 px-4 py-3 pr-36 placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Remember me</label>
          </div>
          <div className="text-sm">
            <Link href={forgotHref} className="font-medium text-primary hover:brightness-110">Forgot password?</Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-lg border border-transparent bg-primary px-4 py-3 text-sm font-medium text-background-dark shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <><div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white" />Signing in...</>
          ) : 'Sign in'}
        </button>
      </form>

      {showDemoAccounts ? (
        <>
          <div className="mt-6">
            <p className="mb-3 text-center text-sm text-slate-600 dark:text-slate-400">Test accounts</p>
            <p className="mb-3 text-center text-xs text-slate-500 dark:text-slate-400">These only work after matching Supabase auth users have been created for the seeded demo emails.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-300 dark:hover:border-primary dark:hover:text-primary"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300 dark:border-slate-600" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-slate-500 dark:bg-background-dark">Or</span></div>
          </div>
        </>
      ) : null}

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href={registerHref} className="font-medium text-primary hover:brightness-110">Create one now</Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
