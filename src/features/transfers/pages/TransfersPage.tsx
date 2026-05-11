'use client';

import TransferHistory from '@/features/transfers/components/TransferHistory';

export default function TransfersPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <TransferHistory />
    </div>
  );
}
