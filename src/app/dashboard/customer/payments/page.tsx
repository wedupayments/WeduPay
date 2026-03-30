"use client";

import { CustomerLayout } from "@/components/dashboard/CustomerLayout";

export default function PaymentsPage() {
  return (
    <CustomerLayout title="Payments">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="size-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">receipt_long</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payments Coming Soon</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            The payments feature is under development. You can fund your wallet and view your transaction history.
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
