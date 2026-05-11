/**
 * Admin Transfers Page
 * 
 * View and manage all platform transfers.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transfer {
  id: string;
  transferRef: string;
  userId: string;
  status: string;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  recipientPhone: string;
  recipientCountry: string;
  createdAt: Date;
}

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadTransfers();
  }, [page, statusFilter]);

  const loadTransfers = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/v1/admin/transfers?${params}`, { credentials: 'include' });

      const data = await response.json();

      if (data.success) {
        setTransfers(data.transfers);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Load transfers error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-primary/15 text-primary',
      PROCESSING: 'bg-primary/10 text-primary',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Transfer Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage all platform transfers
          </p>
        </div>
        <Link
          href="/dashboard/admin"
          className="text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-primary/10 shadow p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <input
            type="text"
            placeholder="Search by reference or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-800"
          />

          <button
            onClick={loadTransfers}
            className="px-6 py-2 bg-primary text-background-dark rounded-lg hover:brightness-110 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Transfer List */}
      <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-primary/10 shadow overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-mono text-sm">{transfer.transferRef}</td>
                      <td className="px-6 py-4 text-sm">{transfer.userId.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">
                            {transfer.sendAmount.toLocaleString()} {transfer.sendCurrency}
                          </p>
                          <p className="text-sm text-gray-500">
                            → {transfer.receiveAmount.toLocaleString()} {transfer.receiveCurrency}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {transfer.recipientPhone}
                        <p className="text-xs text-gray-500">{transfer.recipientCountry}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(transfer.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
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
