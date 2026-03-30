"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEMO_ACCOUNTS = [
  { email: "customer@wedupay.test", password: "password123", userId: "customer-001" },
  { email: "merchant@wedupay.test", password: "password123", userId: "merchant-001" },
  { email: "admin@wedupay.test", password: "password123", userId: "admin-001" },
];

interface AuthFormProps {
  type: "login" | "register";
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard/customer";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"STUDENT" | "MERCHANT">("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === "register") {
        setError("Registration is disabled in demo mode. Use test accounts.");
        return;
      }

      const account = DEMO_ACCOUNTS.find(
        (a) => a.email === email && a.password === password
      );

      if (!account) {
        throw new Error("Invalid email or password");
      }

      const mockToken = btoa(JSON.stringify({ userId: account.userId, email: account.email }));
      document.cookie = `sb-access-token=demo-${mockToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      document.cookie = `wedupay-user-id=${account.userId}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      document.cookie = `wedupay-user-email=${encodeURIComponent(account.email)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Email
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-symbols-outlined text-lg">target</span>
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Password
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-symbols-outlined text-lg">lock</span>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-bold rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">target</span>
        {loading ? "Please wait..." : type === "login" ? "Sign In" : "Create Account"}
      </button>
    </form>
  );
}
