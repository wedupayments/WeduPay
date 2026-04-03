/**
 * Admin Compliance Review Page
 *
 * Review and approve/reject transfers requiring compliance check.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ComplianceItem {
  transferId: string;
  transferRef: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  currency: string;
  riskLevel: string;
  riskScore: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export default function AdminCompliancePage() {
  const [queue, setQueue] = useState<ComplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const response = await fetch('/api/v1/admin/compliance', {
        headers: {
          'x-user-id': 'admin-1',
          'x-user-role': 'ADMIN',
        },
      });

      const data = await response.json();

      if (data.success) {
        setQueue(data.queue);
      }
    } catch (err) {
      console.error('Load compliance queue error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (transferRef: string) => {
    setProcessing(transferRef);
    try {
      const response = await fetch(`/api/v1/admin/compliance/${transferRef}/approve`, {
        method: 'POST',
        headers: {
          'x-user-id': 'admin-1',
          'x-user-role': 'ADMIN',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Remove from queue
        setQueue(queue.filter(item => item.transferRef !== transferRef));
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve transfer');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (transferRef: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setProcessing(transferRef);
    try {
      const response = await fetch(`/api/v1/admin/compliance/${transferRef}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'admin-1',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (data.success) {
        setQueue(queue.filter(item => item.transferRef !== transferRef));
      } else {
        alert(data.error || 'Failed to reject');
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject transfer');
    } finally {
      setProcessing(null);
    }
  };

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Compliance Review</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve high-risk transactions
          </p>
        </div>
        <Link
          href="/dashboard/admin"
          className="text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Queue Stats */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">⚠️</span>
          <div>
            <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              {queue.length} Transfers Pending Review
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              High-risk transactions requiring manual approval
            </p>
          </div>
        </div>
      </div>

      {/* Review Queue */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
            <span className="text-6xl mb-4 block">✅</span>
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No transfers pending compliance review
            </p>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.transferId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-sm text-gray-500 mb-2">
                    {item.transferRef}
                  </p>
                  <h3 className="text-lg font-semibold">
                    {item.userName || item.userEmail || item.userId}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(item.riskLevel)}`}>
                    {item.riskLevel} Risk
                  </span>
                  <span className="text-sm text-gray-500">
                    Score: {item.riskScore}/100
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="font-semibold">
                    {item.amount.toLocaleString()} {item.currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{item.userEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium mb-2">Review Reason</p>
                <p className="text-gray-600 dark:text-gray-400">{item.reason}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(item.transferRef)}
                  disabled={processing === item.transferRef}
                  className="flex-1 px-4 py-3 bg-primary text-background-dark rounded-lg font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {processing === item.transferRef ? 'Processing...' : '✓ Approve'}
                </button>
                <button
                  onClick={() => handleReject(item.transferRef)}
                  disabled={processing === item.transferRef}
                  className="flex-1 px-4 py-3 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {processing === item.transferRef ? 'Processing...' : '✗ Reject'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
