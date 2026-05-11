'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { useAuth } from '@/shared/auth/AuthContext';
import { supabase } from '@/lib/auth-service';

const COUNTRY_OPTIONS = [
  { code: 'ZW', label: 'Zimbabwe' },
  { code: 'KE', label: 'Kenya' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'GH', label: 'Ghana' },
  { code: 'UG', label: 'Uganda' },
  { code: 'TZ', label: 'Tanzania' },
];

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isInitialized, refreshSession } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('ZW');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already has complete profile
  useEffect(() => {
    if (isInitialized && !authLoading && user) {
      // User has a complete profile, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [isInitialized, authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Get current Supabase user
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (!supabaseUser) {
        setError('Session expired. Please sign in again.');
        router.push('/auth/login');
        return;
      }

      // Create profile via API
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email,
          phoneNumber,
          country,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to complete profile');
        setIsSubmitting(false);
        return;
      }

      // Refresh session to load new profile
      await refreshSession();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Profile completion error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Already has profile
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Complete your profile"
      description="We need a few more details to set up your WeduPay account"
      backHref="/auth/login"
      backLabel="Back to sign in"
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start">
            <span className="material-symbols-outlined mr-2 text-red-600 dark:text-red-400">error</span>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="phoneNumber" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Phone number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            required
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="+263771234567"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Include country code (e.g., +263 for Zimbabwe)
          </p>
        </div>

        <div>
          <label htmlFor="country" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Completing profile...' : 'Complete profile'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <CompleteProfileForm />
    </Suspense>
  );
}
