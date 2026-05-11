"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: string;
  fileUrl: string | null;
  fileSize: number | null;
  recordCount: number | null;
  createdAt: string;
  expiresAt: string | null;
}

import { useAuthenticatedFetch } from "@/shared/hooks/useAuthenticatedFetch";

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { fetch: authFetch, isReady } = useAuthenticatedFetch();

  // Form state
  const [type, setType] = useState("TRANSACTIONS");
  const [format, setFormat] = useState("CSV");

  const fetchData = async () => {
    if (!isReady) return;
    try {
      setLoading(true);
      const res = await authFetch("/api/v1/exports");
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Export fetch error:", err);
      toast.error("Failed to load exports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s for status updates
    return () => clearInterval(interval);
  }, [isReady]);

  const handleRequestExport = async () => {
    try {
      setRequesting(true);
      const res = await authFetch("/api/v1/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, format })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Export job scheduled");
        setShowModal(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to schedule export");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setRequesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-100 text-emerald-700";
      case "PROCESSING": return "bg-blue-100 text-blue-700 animate-pulse";
      case "FAILED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Exports</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Export your transaction and settlement data for offline analysis</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_to_photos</span>
          New Export
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Export History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Format</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Summary</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {jobs.length > 0 ? jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold">{job.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{job.format}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {job.recordCount ? `${job.recordCount} records` : "-"}
                    {job.fileSize ? ` (${(job.fileSize / 1024).toFixed(1)} KB)` : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {job.fileUrl ? (
                      <a 
                        href={`/api/v1/exports/${job.id}/download`} 
                        className="text-emerald-600 font-bold hover:underline flex items-center justify-end gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download
                      </a>
                    ) : job.status === 'FAILED' ? (
                        <span className="text-red-400 text-xs">Failed</span>
                    ) : (
                        <span className="text-slate-400 text-xs">Processing...</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={6} className="p-12 text-center text-slate-400">No exports found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Export Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Request Export</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Export Type</label>
                <select 
                   value={type}
                   onChange={(e) => setType(e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="TRANSACTIONS">Transactions</option>
                  <option value="SETTLEMENTS">Settlements</option>
                  <option value="PAYMENT_LINKS">Payment Links</option>
                  <option value="ANALYTICS">Analytics Summary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Format</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormat("CSV")}
                    className={`px-4 py-3 rounded-xl border font-bold transition-all ${format === 'CSV' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-500'}`}
                  >
                    CSV
                  </button>
                  <button 
                    onClick={() => setFormat("EXCEL")}
                    className={`px-4 py-3 rounded-xl border font-bold transition-all ${format === 'EXCEL' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-500'}`}
                  >
                    Excel
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                disabled={requesting}
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button 
                disabled={requesting}
                onClick={handleRequestExport}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {requesting ? "Scheduling..." : "Start Export"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
