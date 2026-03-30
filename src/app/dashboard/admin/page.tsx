"use client";

import { useState, useEffect } from "react";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  type: "MERCHANT" | "STUDENT";
  createdAt: string;
}

interface WaitlistStats {
  total: number;
  merchants: number;
  students: number;
}

export default function AdminDashboardPage() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "MERCHANT" | "STUDENT">("all");

  useEffect(() => {
    fetch("/api/waitlist/list")
      .then((res) => res.json())
      .then((data) => {
        setWaitlist(data.waitlist);
        setStats(data.stats);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filteredWaitlist = filter === "all" ? waitlist : waitlist.filter((w) => w.type === filter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-primary/10 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">people</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Signups</p>
          <h3 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 dark:text-white">{stats?.total || 0}</h3>
        </div>
        <div className="bg-white dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-primary/10 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">storefront</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Merchants</p>
          <h3 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 dark:text-white">{stats?.merchants || 0}</h3>
        </div>
        <div className="bg-white dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-primary/10 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">school</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Students</p>
          <h3 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 dark:text-white">{stats?.students || 0}</h3>
        </div>
      </div>

      {/* Waitlist Table */}
      <div className="bg-white dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-primary/10 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-primary/10 overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Waitlist Entries</h3>
            <div className="flex gap-2">
              {(["all", "MERCHANT", "STUDENT"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all min-h-[36px] ${
                    filter === f
                      ? "bg-primary text-background-dark"
                      : "bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-primary/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">progress_activity</span>
            <p className="text-slate-500 dark:text-slate-400 mt-4">Loading waitlist...</p>
          </div>
        ) : filteredWaitlist.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400">inbox</span>
            <p className="text-slate-500 dark:text-slate-400 mt-4">No waitlist entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-primary/5">
                <tr>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 sm:px-5 py-3">Email</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 sm:px-5 py-3">Name</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 sm:px-5 py-3">Type</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 sm:px-5 py-3">Joined</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 sm:px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-primary/10">
                {filteredWaitlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                    <td className="px-4 sm:px-5 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-none">{entry.email}</p>
                    </td>
                    <td className="px-4 sm:px-5 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{entry.name || "-"}</p>
                    </td>
                    <td className="px-4 sm:px-5 py-4">
                      <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        entry.type === "MERCHANT"
                          ? "bg-primary/10 text-primary"
                          : "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
                      }`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 sm:px-5 py-4">
                      <button className="text-sm font-semibold text-primary hover:underline min-h-[36px]">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
