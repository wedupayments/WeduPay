"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { ThemeToggle } from "@/components/ThemeToggle";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export function DocsContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Documentation</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              WeduPay REST API for mobile money payments
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-primary/10 shadow-sm overflow-x-auto">
          <SwaggerUI url="/api/docs.json" />
        </div>
      </div>
    </div>
  );
}
