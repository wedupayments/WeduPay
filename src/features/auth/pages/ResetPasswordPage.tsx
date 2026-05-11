"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { updatePassword } from "@/lib/auth-service";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { buildTenantPath } from "@/lib/tenant";

function ResetPasswordSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") ?? null;

  const loginHref = tenantSlug ? buildTenantPath("/auth/login", tenantSlug) : "/auth/login";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const initializeRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError && isMounted) {
          setError(sessionError.message);
        }
      }

      if (isMounted) {
        setIsReady(true);
      }
    };

    initializeRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(password);

    if (result.success) {
      setSuccess("Password updated successfully. Redirecting to sign in...");
      setTimeout(() => router.push(loginHref), 1200);
    } else {
      setError(result.error || "Unable to update your password.");
    }

    setIsSubmitting(false);
  };

  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least 8 characters and include one number."
      backHref={loginHref}
      backLabel={tenantSlug ? `Back to ${tenantSlug} sign in` : "Back to sign in"}
    >
      {!isReady ? (
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">Preparing secure reset session...</p>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <PasswordField
          id="password"
          label="New password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="block w-full rounded-lg border border-slate-300 px-4 py-3 pr-36 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="block w-full rounded-lg border border-slate-300 px-4 py-3 pr-36 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />

        <button
          type="submit"
          disabled={!isReady || isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Updating password..." : "Update password"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Remember your password?{" "}
          <Link href={loginHref} className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
