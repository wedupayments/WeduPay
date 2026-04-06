"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
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

    // Client-side validation
    if (!email || !password || !phoneNumber || !country) {
      setError("All fields are required");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must contain at least 1 number");
      return;
    }

    // Validate phone number
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\+?[1-9]\d{8,14}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid phone number with country code (e.g., +263771234567)");
      return;
    }

    // Validate country
    if (country.length !== 2) {
      setError("Please select a valid country");
      return;
    }

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
          ? "Account created! Check your email to verify your account before signing in."
          : "Account created successfully! Redirecting to sign in..."
      );

      setTimeout(() => router.push(loginHref), 2000);
    } else {
      setError(result.error || "We couldn't create your account. Please try again.");
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
            Phone number <span className="text-red-500">*</span>
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
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Include country code (e.g., +263 for Zimbabwe, +254 for Kenya)
          </p>
        </div>

        <div>
          <label htmlFor="country" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            id="country"
            required
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
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Select your country of residence
          </p>
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
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Must be at least 8 characters and contain at least 1 number
        </p>

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
