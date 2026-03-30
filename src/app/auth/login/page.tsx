"use client";

import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";
import { Suspense } from "react";

function AuthFormWrapper() {
  return <AuthForm type="login" />;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-background-dark">
              <span className="material-symbols-outlined font-bold text-xl">account_balance_wallet</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Welcome to WeduPay</h1>
          <p className="text-slate-600 dark:text-slate-400">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-primary/10 p-6 shadow-sm">
          <Suspense fallback={<div className="animate-pulse h-48 bg-slate-100 rounded-lg" />}>
            <AuthFormWrapper />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Test Accounts Info */}
        <div className="mt-8 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-5">
          <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">target</span>
            Test Accounts
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 dark:text-slate-400 flex-1">Demo Customer:</span>
              <code className="bg-white dark:bg-background-dark px-2 py-1 rounded text-slate-900 dark:text-white">customer@wedupay.test</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500"></span>
              <span className="text-slate-600 dark:text-slate-400 flex-1">Merchant:</span>
              <code className="bg-white dark:bg-background-dark px-2 py-1 rounded text-slate-900 dark:text-white">merchant@wedupay.test</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-purple-500"></span>
              <span className="text-slate-600 dark:text-slate-400 flex-1">Admin:</span>
              <code className="bg-white dark:bg-background-dark px-2 py-1 rounded text-slate-900 dark:text-white">admin@wedupay.test</code>
            </div>
            <div className="pt-2 mt-2 border-t border-primary/20">
              <p className="text-slate-500 dark:text-slate-400">
                Password: <code className="bg-white dark:bg-background-dark px-2 py-1 rounded text-primary font-bold">password123</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
