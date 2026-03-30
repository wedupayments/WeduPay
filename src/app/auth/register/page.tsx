"use client";

import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";
import { Suspense } from "react";

function AuthFormWrapper() {
  return <AuthForm type="register" />;
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-background-dark">
              <span className="material-symbols-outlined font-bold text-xl">account_balance_wallet</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Create Account</h1>
          <p className="text-slate-600 dark:text-slate-400">Join WeduPay today</p>
        </div>

        <div className="bg-white dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-primary/10 p-6 shadow-sm">
          <Suspense fallback={<div className="animate-pulse h-48 bg-slate-100 rounded-lg" />}>
            <AuthFormWrapper />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
