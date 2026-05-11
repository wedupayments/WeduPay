"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { sendPasswordReset } from "@/lib/auth-service";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { buildTenantPath } from "@/lib/tenant";

function ForgotPasswordSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") ?? null;

  const backHref = tenantSlug ? buildTenantPath("/auth/login", tenantSlug) : "/auth/login";
  const loginHref = tenantSlug ? buildTenantPath("/auth/login", tenantSlug) : "/auth/login";

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const result = await sendPasswordReset(normalizedEmail, tenantSlug);

    if (result.success) {
      setSuccess("Password reset email sent. Check your inbox for the recovery link.");
    } else {
      setError(result.error || "We couldn't send the reset email right now.");
    }

    setIsSubmitting(false);
  };

  return (
    <AuthShell
      title="Reset your password"
      description={tenantSlug ? `Recover your ${tenantSlug} workspace password` : "Enter the email address you use for WeduPay and we'll send you a reset link."}
      backHref={backHref}
      backLabel={tenantSlug ? `Back to ${tenantSlug} sign in` : "Back to sign in"}
    >
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
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending reset link..." : "Send reset link"}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordSkeleton />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
