/**
 * Admin Dashboard Page
 * 
 * Main admin dashboard showing platform statistics,
 * recent transfers, and provider health.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalTransfers: number;
  pendingTransfers: number;
  failedTransfers: number;
  totalVolume: number;
  todayVolume: number;
  providerHealth: Array<{ provider: string; status: string; uptime: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/stats', { credentials: 'include' });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Load stats error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button onClick={loadStats} className="mt-2 text-primary hover:underline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="primary"
        />
        <StatCard
          title="Total Transfers"
          value={stats?.totalTransfers || 0}
          icon="💸"
          color="primary"
        />
        <StatCard
          title="Pending Review"
          value={stats?.pendingTransfers || 0}
          icon="⏳"
          color="yellow"
          link="/dashboard/admin/compliance"
        />
        <StatCard
          title="Failed Transfers"
          value={stats?.failedTransfers || 0}
          icon="❌"
          color="red"
        />
      </div>

      {/* Volume Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Volume</h3>
          <p className="text-3xl font-bold text-primary">
            ${stats?.todayVolume.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Total: ${stats?.totalVolume.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/dashboard/admin/transfers"
              className="block p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/15 transition"
            >
              📋 View All Transfers
            </Link>
            <Link
              href="/dashboard/admin/compliance"
              className="block p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
            >
              ⚠️ Compliance Review ({stats?.pendingTransfers || 0})
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="block p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
            >
              👥 Manage Users
            </Link>
          </div>
        </div>
      </div>

      {/* Provider Health */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Provider Health Status</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {stats?.providerHealth.map((provider) => (
            <div
              key={provider.provider}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{provider.provider}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    provider.status === 'HEALTHY'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {provider.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uptime: {provider.uptime.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  title,
  value,
  icon,
  color,
  link,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  link?: string;
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary/10',
    green: 'bg-primary/10',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
  };

  const content = (
    <div className={`${colors[color]} rounded-xl shadow p-6`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        {link && (
          <Link href={link} className="text-primary hover:underline text-sm">
            View →
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
    </div>
  );

  return link ? (
    <Link href={link}>{content}</Link>
  ) : (
    content
  );
}
