"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordReset } from "@/lib/auth-service";

export default function ForgotPasswordPage() {
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
    const result = await sendPasswordReset(normalizedEmail);

    if (result.success) {
      setSuccess("Password reset email sent. Check your inbox for the recovery link.");
    } else {
      setError(result.error || "We couldn't send the reset email right now.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-8">
        <Link href="/auth/login" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Back to sign in
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter the email address you use for WeduPay and we&apos;ll send you a reset link.
        </p>

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
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
