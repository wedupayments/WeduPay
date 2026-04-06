"use client";

import { useState } from "react";

export default function ApiKeysPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keys, setKeys] = useState([
    {
      id: "1",
      name: "Production API Key",
      key: "sk_live_abc123...xyz789",
      created: "2024-01-15",
      lastUsed: "2 hours ago",
      status: "active",
    },
    {
      id: "2",
      name: "Test API Key",
      key: "sk_test_def456...uvw012",
      created: "2024-01-10",
      lastUsed: "1 day ago",
      status: "active",
    },
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Keys</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your API keys for integration</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          Create API Key
        </button>
      </div>

      {/* Documentation Card */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">integration_instructions</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">API Documentation</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Learn how to integrate WeduPay into your application with our comprehensive API documentation.
            </p>
            <a
              href="/docs/api"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              View Documentation
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {keys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white">{apiKey.name}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    apiKey.status === "active"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                  }`}>
                    {apiKey.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mb-3">
                  <code className="flex-1 text-sm font-mono text-slate-600 dark:text-slate-400">
                    {apiKey.key}
                  </code>
                  <button className="text-emerald-600 hover:text-emerald-700 shrink-0">
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                  <button className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 shrink-0">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    Created {apiKey.created}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    Last used {apiKey.lastUsed}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 lg:flex-col">
                <button className="flex-1 lg:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-semibold">
                  Edit
                </button>
                <button className="flex-1 lg:flex-none px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-semibold">
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Production API Key"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Environment
                </label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option>Production</option>
                  <option>Test</option>
                </select>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Make sure to copy your API key now. You won't be able to see it again!
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-semibold">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
