"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updatePassword } from "@/lib/auth-service";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
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
      setTimeout(() => router.push("/auth/login"), 1200);
    } else {
      setError(result.error || "Unable to update your password.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-8">
        <Link href="/auth/login" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Back to sign in
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Choose a new password</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Use at least 8 characters and include one number.
        </p>

        {!isReady ? (
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">Preparing secure reset session...</p>
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
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={!isReady || isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating password..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
