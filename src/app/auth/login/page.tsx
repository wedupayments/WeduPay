"use client";

import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";
import { Suspense } from "react";

function AuthFormWrapper() {
  return <AuthForm type="login" />;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background-dark dark:to-slate-900 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping"></div>
              <div className="relative size-12 sm:size-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined font-bold text-2xl sm:text-3xl text-background-dark">gps_fixed</span>
              </div>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">Welcome to WeduPay</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-primary/10 p-4 sm:p-6 shadow-lg shadow-primary/5">
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
        <div className="mt-6 sm:mt-8 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-bold text-primary mb-2 sm:mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-base sm:text-lg">gps_fixed</span>
            Test Accounts
          </h3>
          <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs">
            <div className="flex items-center gap-2">
              <span className="size-1.5 sm:size-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 dark:text-slate-400 flex-1">Demo Customer:</span>
              <code className="bg-white dark:bg-background-dark px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-slate-900 dark:text-white">customer@wedupay.test</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 sm:size-2 rounded-full bg-green-500"></span>
              <span className="text-slate-600 dark:text-slate-400 flex-1">Merchant:</span>
              <code className="bg-white dark:bg-background-dark px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-slate-900 dark:text-white">merchant@wedupay.test</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 sm:size-2 rounded-full bg-purple-500"></span>
              <span className="text-slate-600 dark:text-slate-400 flex-1">Admin:</span>
              <code className="bg-white dark:bg-background-dark px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-slate-900 dark:text-white">admin@wedupay.test</code>
            </div>
            <div className="pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 border-t border-primary/20">
              <p className="text-slate-500 dark:text-slate-400">
                Password: <code className="bg-white dark:bg-background-dark px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-primary font-bold">password123</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
