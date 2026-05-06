'use client';

import { FXSnapshot } from '@/components/fx/FXSnapshot';
import P2PTransferForm from '@/components/transfers/P2PTransferForm';

export default function SendMoneyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <FXSnapshot
          title="Transfer FX Rates"
          subtitle="Customers can quickly see the latest conversion picture before they request a transfer quote."
        />
        <P2PTransferForm />
      </div>
    </div>
  );
}
