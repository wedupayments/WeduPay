/**
 * Fund Wallet Page
 */

'use client';

import FundWalletForm from '@/features/wallets/components/FundWalletForm';
import Link from 'next/link';

export default function FundWalletPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/customer/wallets"
          className="text-blue-600 hover:underline"
        >
          ← Back to Wallets
        </Link>
        <h1 className="text-2xl font-bold mt-2">Fund Your Wallet</h1>
      </div>

      <FundWalletForm
        onSuccess={() => {
          window.location.href = '/dashboard/customer/wallets?success=funded';
        }}
      />
    </div>
  );
}
