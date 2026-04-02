'use client';

import { Suspense } from 'react';
import TransferSuccess from '@/components/transfers/TransferSuccess';

function TransferSuccessContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TransferSuccess />
    </div>
  );
}

export default function TransferSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <TransferSuccessContent />
    </Suspense>
  );
}
