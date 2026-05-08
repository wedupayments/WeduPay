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

interface FXAdminStatus {
  provider: string;
  configured: boolean;
  refreshed?: boolean;
  trackedSymbols?: string[];
  count: number;
  latest: {
    updatedAt: string;
    validUntil: string | null;
    baseCurrency: string;
    targetCurrency: string;
    rate: number;
  } | null;
}

interface RailProviderHealth {
  id: string;
  name: string;
  displayName: string;
  region: string;
  status: string;
  isReachable: boolean;
  responseTime: number;
  successRate: number;
  avgResponseTime: number;
  uptime: number;
  lastHealthCheck: string | null;
  transactionCount: number;
  healthCheckCount: number;
  supportedCountries: string[];
  supportedCurrencies: string[];
  feePercentage: number;
  feeFixed: number;
}

interface RailHealthResponse {
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
  };
  providers: RailProviderHealth[];
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fxStatus, setFxStatus] = useState<FXAdminStatus | null>(null);
  const [railHealth, setRailHealth] = useState<RailHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingFx, setIsRefreshingFx] = useState(false);
  const [isRefreshingRails, setIsRefreshingRails] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStats();
    loadFxStatus();
    loadRailHealth();
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

  const loadFxStatus = async () => {
    try {
      const response = await fetch('/api/v1/admin/fx/refresh', { credentials: 'include' });
      const data = await response.json();

      if (data.success) {
        setFxStatus(data.fx);
      }
    } catch (err) {
      console.error('Load FX status error:', err);
    }
  };

  const loadRailHealth = async () => {
    try {
      const response = await fetch('/api/v1/routing/health', { credentials: 'include' });
      const data = await response.json();

      if (data.success) {
        setRailHealth({
          summary: data.summary,
          providers: data.providers,
          timestamp: data.timestamp,
        });
      }
    } catch (err) {
      console.error('Load payment rails health error:', err);
    }
  };

  const handleRefreshFx = async () => {
    try {
      setIsRefreshingFx(true);
      const response = await fetch('/api/v1/admin/fx/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setFxStatus(data.fx);
      } else {
        setError(data.error || 'Failed to refresh FX rates');
      }
    } catch (err) {
      console.error('Refresh FX error:', err);
      setError('Failed to refresh FX rates');
    } finally {
      setIsRefreshingFx(false);
    }
  };

  const handleRefreshRails = async () => {
    try {
      setIsRefreshingRails(true);
      const response = await fetch('/api/v1/routing/health', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to refresh provider health');
        return;
      }

      await loadRailHealth();
    } catch (err) {
      console.error('Refresh payment rails health error:', err);
      setError('Failed to refresh provider health');
    } finally {
      setIsRefreshingRails(false);
    }
  };

  const trackedRailNames = ['ecocash', 'pawapay'];
  const trackedRails = trackedRailNames.map((name) =>
    railHealth?.providers.find((provider) => provider.name === name) || null
  );

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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Payment Rails</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Operational view for Zimbabwe EcoCash and regional PawaPay routing.
            </p>
          </div>
          <button
            onClick={handleRefreshRails}
            disabled={isRefreshingRails}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background-dark hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <span className="material-symbols-outlined text-base">
              {isRefreshingRails ? 'progress_activity' : 'sync'}
            </span>
            {isRefreshingRails ? 'Refreshing...' : 'Refresh Rails'}
          </button>
        </div>

        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <PaymentRailCard
            title="Zimbabwe Rail"
            expectedProvider="ecocash"
            provider={trackedRails[0]}
            description="Direct official EcoCash API"
            fallbackCountries={['ZW']}
          />
          <PaymentRailCard
            title="Regional Rail"
            expectedProvider="pawapay"
            provider={trackedRails[1]}
            description="PawaPay aggregator for supported non-Zimbabwe markets"
            fallbackCountries={['ZM', 'UG', 'TZ', 'GH', 'NG']}
          />
        </div>

        {railHealth && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
            <RailSummary label="Total" value={railHealth.summary.total} />
            <RailSummary label="Healthy" value={railHealth.summary.healthy} tone="green" />
            <RailSummary label="Degraded" value={railHealth.summary.degraded} tone="yellow" />
            <RailSummary label="Unhealthy" value={railHealth.summary.unhealthy} tone="red" />
            <RailSummary label="Unknown" value={railHealth.summary.unknown} />
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">FX Rate Sync</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Warm Open Exchange Rates into the database for customer FX displays and transfer quotes.
            </p>
          </div>
          <button
            onClick={handleRefreshFx}
            disabled={isRefreshingFx || !fxStatus?.configured}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background-dark hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <span className="material-symbols-outlined text-base">
              {isRefreshingFx ? 'progress_activity' : 'sync'}
            </span>
            {isRefreshingFx ? 'Refreshing...' : 'Refresh FX Rates'}
          </button>
        </div>

        <div className="mt-5 grid md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Provider</p>
            <p className="mt-2 font-semibold text-gray-900 dark:text-white">
              {fxStatus?.provider || 'Open Exchange Rates'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Configuration</p>
            <p className="mt-2 font-semibold text-gray-900 dark:text-white">
              {fxStatus?.configured ? 'Configured' : 'Missing App ID'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Stored Live Pairs</p>
            <p className="mt-2 font-semibold text-gray-900 dark:text-white">
              {fxStatus?.count || 0}
            </p>
          </div>
        </div>

        {fxStatus?.latest && (
          <div className="mt-4 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Latest stored pair:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {fxStatus.latest.baseCurrency}/{fxStatus.latest.targetCurrency}
              </span>{" "}
              at{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {fxStatus.latest.rate.toFixed(4)}
              </span>
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Updated {new Date(fxStatus.latest.updatedAt).toLocaleString()}
              {fxStatus.latest.validUntil
                ? ` • Valid until ${new Date(fxStatus.latest.validUntil).toLocaleString()}`
                : ''}
            </p>
          </div>
        )}

        {!fxStatus?.configured && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              Add <code>OPEN_EXCHANGE_RATES_APP_ID</code> to your environment before using live FX refresh.
            </p>
          </div>
        )}
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

function PaymentRailCard({
  title,
  expectedProvider,
  provider,
  description,
  fallbackCountries,
}: {
  title: string;
  expectedProvider: string;
  provider: RailProviderHealth | null;
  description: string;
  fallbackCountries: string[];
}) {
  const status = provider?.status || 'MISSING';
  const statusClass =
    status === 'HEALTHY'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : status === 'DEGRADED'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        : status === 'MISSING' || status === 'UNHEALTHY'
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';

  const countries = provider?.supportedCountries?.length ? provider.supportedCountries : fallbackCountries;
  const currencies = provider?.supportedCurrencies || [];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
          <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {provider?.displayName || expectedProvider}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}`}>
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {provider ? `${provider.successRate.toFixed(1)}%` : 'Not seeded'}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Uptime</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {provider ? `${provider.uptime.toFixed(1)}%` : 'Not seeded'}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Transactions</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {provider?.transactionCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Last Check</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {provider?.lastHealthCheck ? new Date(provider.lastHealthCheck).toLocaleDateString() : 'None'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Countries</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {countries.slice(0, 12).map((country) => (
            <span key={country} className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {country}
            </span>
          ))}
          {countries.length > 12 && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-gray-700 dark:text-slate-300">
              +{countries.length - 12}
            </span>
          )}
        </div>
      </div>

      {currencies.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Currencies</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {currencies.join(', ')}
          </p>
        </div>
      )}

      {!provider && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            Run <code>npx tsx prisma/seed-routing.ts</code> to add this provider to the database.
          </p>
        </div>
      )}
    </div>
  );
}

function RailSummary({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: number;
  tone?: 'slate' | 'green' | 'yellow' | 'red';
}) {
  const tones = {
    slate: 'bg-slate-50 text-slate-900 dark:bg-gray-700 dark:text-white',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  };

  return (
    <div className={`rounded-lg p-3 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
