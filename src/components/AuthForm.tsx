"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Create user record in database
        if (data.user) {
          const res = await fetch("/api/auth/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              userId: data.user.id,
              userType,
            }),
          });

          if (!res.ok) throw new Error("Failed to create user profile");
        }

        alert("Check your email for the confirmation link!");
      } else {
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
          document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        }

        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field with Bulls Eye Icon */}
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

      {/* Password Field with Bulls Eye Icon */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Password
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-symbols-outlined text-lg">target</span>
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

      {/* User Type Selection (Register only) */}
      {type === "register" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            I am a
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUserType("STUDENT")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                userType === "STUDENT"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-primary/50"
              }`}
            >
              <span className="material-symbols-outlined text-lg">school</span>
              Student
            </button>
            <button
              type="button"
              onClick={() => setUserType("MERCHANT")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                userType === "MERCHANT"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-primary/50"
              }`}
            >
              <span className="material-symbols-outlined text-lg">storefront</span>
              Merchant
            </button>
          </div>
        </div>
      )}

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
