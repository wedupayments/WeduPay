"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { registerUser } from "@/lib/auth-service";
import { buildTenantPath } from "@/lib/tenant";

function RegisterSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

const COUNTRY_OPTIONS = [
  { code: "ZW", label: "Zimbabwe" },
  { code: "KE", label: "Kenya" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "UG", label: "Uganda" },
  { code: "TZ", label: "Tanzania" },
];

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") ?? null;

  const backHref = tenantSlug ? buildTenantPath("/auth/login", tenantSlug) : "/auth/login";
  const loginHref = tenantSlug ? buildTenantPath("/auth/login", tenantSlug) : "/auth/login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("ZW");
  const [role, setRole] = useState("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const result = await registerUser({
      email,
      password,
      phoneNumber,
      country,
      role,
    });

    if (result.success) {
      setSuccess(
        result.requiresConfirmation
          ? "Account created. Check your email to verify the account before signing in."
          : "Account created successfully. Redirecting to sign in..."
      );

      setTimeout(() => router.push(loginHref), 1200);
    } else {
      setError(result.error || "We couldn't create your account.");
    }

    setIsSubmitting(false);
  };

  return (
    <AuthShell
      title="Create your account"
      description={tenantSlug ? `Join ${tenantSlug}'s workspace on WeduPay` : "Join WeduPay with one consistent sign-up flow."}
      backHref={backHref}
      backLabel={tenantSlug ? `Back to ${tenantSlug} sign in` : "Back to sign in"}
    >
      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="you@example.com"
          />
        </div>

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
            onChange={(event) => setPhoneNumber(event.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="+263771234567"
          />
        </div>

        <div>
          <label htmlFor="country" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Account Type
          </label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="USER">Customer (Personal Wallet)</option>
            <option value="MERCHANT">Business (Merchant Account)</option>
          </select>
        </div>

        <PasswordField
          id="password"
          label="Password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="block w-full rounded-lg border border-slate-300 px-4 py-3 pr-36 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          placeholder="At least 8 characters and 1 number"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link href={loginHref} className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
