'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transfer {
  transferRef: string;
  status: string;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  recipientPhone: string;
  recipientName: string;
  recipientCountry: string;
  createdAt: string;
  completedAt?: string;
}

export default function TransferHistory() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadTransfers();
  }, [page, statusFilter]);

  const loadTransfers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/v1/transfers/p2p/history?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransfers(data.transfers);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-primary/15 text-primary',
      PROCESSING: 'bg-primary/10 text-primary',
      PENDING: 'bg-yellow-100 text-yellow-800',
      PENDING_REVIEW: 'bg-orange-100 text-orange-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      KE: '🇰🇪', TZ: '🇹🇿', UG: '🇺🇬', NG: '🇳🇬', GH: '🇬🇭',
      SN: '🇸🇳', CI: '🇨🇮', ZW: '🇿🇼', ZM: '🇿🇲', MZ: '🇲🇿',
    };
    return flags[countryCode] || '🌍';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Transfer History</h1>
          <p className="text-slate-600 dark:text-slate-400">View and track your international transfers</p>
        </div>
        <Link
          href="/dashboard/customer/transfers/send"
          className="bg-primary text-background-dark px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition shadow-lg shadow-primary/20"
        >
          + New Transfer
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Transfer List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading transfers...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💸</div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">No transfers yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Start by sending money to your loved ones</p>
            <Link
              href="/dashboard/customer/transfers/send"
              className="inline-block bg-primary text-background-dark px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition shadow-lg shadow-primary/20"
            >
              Send Money
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {transfers.map((transfer) => (
                    <tr key={transfer.transferRef} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                          {transfer.transferRef}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{transfer.recipientName || 'N/A'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {getCountryFlag(transfer.recipientCountry)} {transfer.recipientCountry}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {transfer.receiveAmount.toLocaleString()} {transfer.receiveCurrency}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            ({transfer.sendAmount.toLocaleString()} {transfer.sendCurrency})
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {transfer.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(transfer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/dashboard/customer/transfers/${transfer.transferRef}`}
                          className="text-primary hover:brightness-110 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
              {transfers.map((transfer) => (
                <div key={transfer.transferRef} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                      {transfer.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(transfer.createdAt)}</span>
                  </div>
                  <div className="mb-3">
                    <p className="font-medium text-slate-900 dark:text-white">{transfer.recipientName || 'N/A'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {getCountryFlag(transfer.recipientCountry)} To {transfer.recipientCountry}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {transfer.receiveAmount.toLocaleString()} {transfer.receiveCurrency}
                    </p>
                    <Link
                      href={`/dashboard/customer/transfers/${transfer.transferRef}`}
                      className="text-primary font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} transfers
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
