'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Transfer {
  transferRef: string;
  status: string;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  exchangeRate: number;
  recipientPhone: string;
  recipientCountry: string;
  recipientName?: string;
  providerReference?: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

interface StatusStep {
  status: string;
  timestamp: string;
  description: string;
}

export default function TransferDetails() {
  const params = useParams();
  const router = useRouter();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState<StatusStep[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (params.ref) {
      loadTransferDetails();
      // Poll for status updates if not completed
      const interval = setInterval(() => {
        if (transfer?.status !== 'COMPLETED' && transfer?.status !== 'FAILED') {
          loadTransferDetails();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [params.ref]);

  const loadTransferDetails = async () => {
    try {
      const response = await fetch(`/api/v1/transfers/p2p?ref=${params.ref}`);
      const data = await response.json();

      if (data.success) {
        setTransfer(data.transfer);
        setStatusHistory(data.statusHistory || []);
      } else {
        setError(data.error || 'Failed to load transfer details');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'text-green-600',
      PROCESSING: 'text-blue-600',
      PENDING: 'text-yellow-600',
      PENDING_REVIEW: 'text-orange-600',
      FAILED: 'text-red-600',
      REFUNDED: 'text-gray-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusBg = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 border-green-200',
      PROCESSING: 'bg-blue-100 border-blue-200',
      PENDING: 'bg-yellow-100 border-yellow-200',
      PENDING_REVIEW: 'bg-orange-100 border-orange-200',
      FAILED: 'bg-red-100 border-red-200',
      REFUNDED: 'bg-gray-100 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 border-gray-200';
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      KE: '🇰🇪', TZ: '🇹🇿', UG: '🇺🇬', NG: '🇳🇬', GH: '🇬🇭',
      SN: '🇸🇳', CI: '🇨🇮', ZW: '🇿🇼', ZM: '🇿🇲', MZ: '🇲🇿',
    };
    return flags[countryCode] || '🌍';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading transfer details...</p>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Transfer</h2>
          <p className="text-gray-600 mb-6">{error || 'Transfer not found'}</p>
          <Link
            href="/dashboard/customer/transfers"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Transfers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/customer/transfers"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Transfers
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Transfer Details</h1>
            <p className="text-gray-600 font-mono text-sm">{transfer.transferRef}</p>
          </div>
          <span className={`px-4 py-2 rounded-full font-semibold ${getStatusBg(transfer.status)} ${getStatusColor(transfer.status)}`}>
            {transfer.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Transfer Information</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Send Side */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Amount Sent</p>
            <p className="text-2xl font-bold">{transfer.sendAmount.toLocaleString()} {transfer.sendCurrency}</p>
          </div>

          {/* Receive Side */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Recipient Receives</p>
            <p className="text-2xl font-bold text-green-600">
              {transfer.receiveAmount.toLocaleString()} {transfer.receiveCurrency}
            </p>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="border-t mt-4 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Exchange Rate</span>
            <span className="font-medium">
              1 {transfer.sendCurrency} = {transfer.exchangeRate.toFixed(2)} {transfer.receiveCurrency}
            </span>
          </div>
        </div>
      </div>

      {/* Recipient Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Recipient</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="text-gray-600 w-32">Name:</span>
            <span className="font-medium">{transfer.recipientName || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 w-32">Phone:</span>
            <span className="font-medium">{transfer.recipientPhone}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 w-32">Country:</span>
            <span className="font-medium">
              {getCountryFlag(transfer.recipientCountry)} {transfer.recipientCountry}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
        <div className="space-y-3">
          {transfer.providerReference && (
            <div className="flex items-center">
              <span className="text-gray-600 w-32">Provider Ref:</span>
              <span className="font-mono text-sm">{transfer.providerReference}</span>
            </div>
          )}
          <div className="flex items-center">
            <span className="text-gray-600 w-32">Created:</span>
            <span>{formatDate(transfer.createdAt)}</span>
          </div>
          {transfer.completedAt && (
            <div className="flex items-center">
              <span className="text-gray-600 w-32">Completed:</span>
              <span>{formatDate(transfer.completedAt)}</span>
            </div>
          )}
          {transfer.failureReason && (
            <div className="flex items-start">
              <span className="text-gray-600 w-32">Failure Reason:</span>
              <span className="text-red-600">{transfer.failureReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      {statusHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Status Timeline</h2>
          <div className="space-y-4">
            {statusHistory.map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    index === statusHistory.length - 1 ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">{step.description}</p>
                  <p className="text-sm text-gray-500">{formatDate(step.timestamp)}</p>
                  <p className="text-xs text-gray-400 mt-1">{step.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {transfer.status === 'COMPLETED' && (
          <Link
            href="/dashboard/customer/transfers/send"
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 text-center"
          >
            Send Another Transfer
          </Link>
        )}
        {transfer.status === 'FAILED' && (
          <button
            onClick={() => router.push(`/dashboard/customer/transfers/send?retry=${transfer.transferRef}`)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
        {(transfer.status === 'PENDING_REVIEW' || transfer.status === 'PROCESSING') && (
          <div className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold text-center">
            {transfer.status === 'PENDING_REVIEW' ? 'Under Review' : 'Processing...'}
          </div>
        )}
      </div>
    </div>
  );
}
