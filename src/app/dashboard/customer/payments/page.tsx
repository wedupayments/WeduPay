"use client";

export default function PaymentsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12 sm:py-16 lg:py-20">
        <div className="size-16 sm:size-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary">receipt_long</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3"> Payments Coming Soon</h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-sm mx-auto px-4">
          The payments feature is under development. You can fund your wallet and view your transaction history.
        </p>
      </div>
    </div>
  );
}
