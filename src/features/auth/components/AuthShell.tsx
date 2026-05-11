"use client";

import Link from "next/link";
import Image from "next/image";

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  footer?: React.ReactNode;
}

export function AuthShell({
  title,
  description,
  children,
  backHref = "/",
  backLabel = "Back to home",
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={backHref} className="inline-block text-sm text-primary hover:brightness-110">
            {backLabel}
          </Link>

          <div className="mt-6 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="WeduPay"
              width={184}
              height={54}
              priority
              loading="eager"
              className="h-12 w-auto"
            />
          </div>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-primary/10 dark:bg-background-dark">
          {children}
        </div>

        {footer ? (
          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
