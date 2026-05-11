'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TransferResult {
  transferRef: string;
  status: string;
  receiveAmount: number;
  receiveCurrency: string;
  recipientPhone: string;
  recipientCountry: string;
  estimatedDelivery: string;
}

export default function TransferSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<TransferResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const transferId = searchParams.get('id');
    if (transferId) {
      loadTransferResult(transferId);
    }
  }, [searchParams]);

  const loadTransferResult = async (transferRef: string) => {
    try {
      const response = await fetch(`/api/v1/transfers/p2p?ref=${transferRef}`);
      const data = await response.json();

      if (data.success) {
        setResult({
          transferRef: data.transfer.transferRef,
          status: data.transfer.status,
          receiveAmount: data.transfer.receiveAmount,
          receiveCurrency: data.transfer.receiveCurrency,
          recipientPhone: data.transfer.recipientPhone,
          recipientCountry: data.transfer.recipientCountry,
          estimatedDelivery: 'Instant',
        });
      }
    } catch (error) {
      console.error('Failed to load transfer result:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      KE: '🇰🇪', TZ: '🇹🇿', UG: '🇺🇬', NG: '🇳🇬', GH: '🇬🇭',
      SN: '🇸🇳', CI: '🇨🇮', ZW: '🇿🇼', ZM: '🇿🇲', MZ: '🇲🇿',
    };
    return flags[countryCode] || '🌍';
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading transfer status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Success Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Successful!</h1>
        <p className="text-gray-600 mb-8">Your money has been sent successfully</p>

        {/* Amount Card */}
        {result && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 mb-8">
            <p className="text-green-100 text-sm mb-2">Recipient Will Receive</p>
            <p className="text-4xl font-bold mb-2">
              {result.receiveAmount.toLocaleString()} {result.receiveCurrency}
            </p>
            <div className="flex items-center justify-center text-green-100">
              <span>{getCountryFlag(result.recipientCountry)}</span>
              <span className="ml-2">to {result.recipientCountry}</span>
            </div>
          </div>
        )}

        {/* Transfer Reference */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-600 mb-2">Transfer Reference</p>
          <p className="font-mono text-lg font-semibold">{result?.transferRef}</p>
          <button
            onClick={() => navigator.clipboard.writeText(result?.transferRef || '')}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            Copy to clipboard
          </button>
        </div>

        {/* Delivery Info */}
        {result && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center">
              <span className="text-2xl mr-3">⚡</span>
              <div className="text-left">
                <p className="font-semibold text-blue-800">{result.estimatedDelivery}</p>
                <p className="text-sm text-blue-600">
                  Funds will be available in {result.recipientPhone}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard/customer/transfers"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View Transfer History
          </Link>
          <Link
            href="/dashboard/customer/transfers/send"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Send Another Transfer
          </Link>
          <Link
            href="/dashboard/customer"
            className="block w-full text-blue-600 py-3 font-semibold hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">What Happens Next?</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
              1
            </div>
            <div className="ml-4">
              <p className="font-medium">Transfer Complete</p>
              <p className="text-sm text-gray-600">The recipient has received the funds in their mobile wallet</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              2
            </div>
            <div className="ml-4">
              <p className="font-medium">Confirmation Sent</p>
              <p className="text-sm text-gray-600">A confirmation email and SMS have been sent to both parties</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
              3
            </div>
            <div className="ml-4">
              <p className="font-medium">Track Your Transfer</p>
              <p className="text-sm text-gray-600">You can track this transfer anytime from your transfer history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
