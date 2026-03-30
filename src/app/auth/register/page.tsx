"use client";

import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";
import { Suspense } from "react";

function AuthFormWrapper() {
  return <AuthForm type="register" />;
}

export default function RegisterPage() {
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">Create Account</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Join WeduPay today</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-primary/10 p-4 sm:p-6 shadow-lg shadow-primary/5">
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
