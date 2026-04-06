"use client";

import { useState } from "react";

export default function PaymentLinksPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [links, setLinks] = useState([
    {
      id: "1",
      title: "Product Purchase",
      amount: "$50.00",
      url: "https://pay.wedupay.com/abc123",
      status: "active",
      uses: 12,
      created: "2024-01-15",
    },
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Links</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Create and manage payment links for your customers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          Create Link
        </button>
      </div>

      {/* Links Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">link</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                link.status === "active"
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
              }`}>
                {link.status}
              </span>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{link.title}</h3>
            <p className="text-2xl font-bold text-emerald-600 mb-4">{link.amount}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Uses</span>
                <span className="font-semibold text-slate-900 dark:text-white">{link.uses}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Created</span>
                <span className="font-semibold text-slate-900 dark:text-white">{link.created}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
              <input
                type="text"
                value={link.url}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-600 dark:text-slate-400 outline-none"
              />
              <button className="text-emerald-600 hover:text-emerald-700">
                <span className="material-symbols-outlined">content_copy</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-semibold">
                Edit
              </button>
              <button className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-semibold">
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {links.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700">link</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">No payment links yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Create your first payment link to start accepting payments</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
            >
              Create Payment Link
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create Payment Link</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Product Purchase"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Currency
                </label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
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
