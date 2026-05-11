"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface WebhookEndpoint {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  isActive: boolean;
  secretKey: string;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  eventType: string;
  status: string;
  httpStatus: number | null;
  responseTime: number | null;
  createdAt: string;
  endpoint: { url: string };
}

import { useAuthenticatedFetch } from "@/shared/hooks/useAuthenticatedFetch";

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { fetch: authFetch, isReady } = useAuthenticatedFetch();
  
  // Form state
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("endpoints");

  const fetchData = async () => {
    if (!isReady) return;
    try {
      setLoading(true);
      const [epRes, delRes] = await Promise.all([
        authFetch("/api/v1/webhooks/endpoints"),
        authFetch("/api/v1/webhooks/deliveries")
      ]);

      const epData = await epRes.json();
      const delData = await delRes.json();

      if (epData.success) setEndpoints(epData.endpoints || []);
      if (delData.success) setDeliveries(delData.deliveries || []);
    } catch (err) {
      console.error("Webhook fetch error:", err);
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isReady]);

  const handleCreate = async () => {
    try {
      const res = await authFetch("/api/v1/webhooks/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, description, events: ["*"] })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Webhook endpoint added");
        setShowModal(false);
        setUrl("");
        setDescription("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to add endpoint");
      }
    } catch (err) {
        toast.error("An error occurred");
    }
  };

  const regenerateSecret = async (id: string) => {
    if (!confirm("Are you sure? This will invalidate the existing secret key.")) return;
    try {
      const res = await authFetch(`/api/v1/webhooks/endpoints/${id}/regenerate-secret`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Secret key regenerated");
        fetchData();
      }
    } catch (err) {
        toast.error("Failed to regenerate secret");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Webhooks</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage HTTP callbacks for real-time payment updates</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all"
        >
          Add Endpoint
        </button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab("endpoints")}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'endpoints' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}
        >
          Endpoints
        </button>
        <button 
          onClick={() => setActiveTab("deliveries")}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'deliveries' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}
        >
          Delivery Logs
        </button>
      </div>

      {activeTab === "endpoints" ? (
        <div className="grid gap-6">
          {endpoints.length > 0 ? endpoints.map((ep) => (
            <div key={ep.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-lg">{ep.url}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ep.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {ep.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{ep.description || "No description"}</p>
                  
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Secret Key</label>
                    <div className="flex items-center justify-between gap-2">
                        <code className="text-xs text-slate-600 dark:text-slate-400 font-mono truncate">{ep.secretKey}</code>
                        <button 
                            onClick={() => regenerateSecret(ep.id)}
                            className="text-xs text-emerald-600 font-bold hover:underline"
                        >
                            Regenerate
                        </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                      <span className="material-symbols-outlined text-lg">settings</span>
                    </button>
                    <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-red-400">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
              </div>
            </div>
          )) : !loading && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                No webhook endpoints configured
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full">
             <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
               <tr>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Event</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">URL</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Latency</th>
                 <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Time</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
               {deliveries.length > 0 ? deliveries.map(del => (
                 <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                   <td className="px-6 py-4 text-sm font-semibold">{del.eventType}</td>
                   <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-[200px]" title={del.endpoint.url}>{del.endpoint.url}</td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold ${del.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                       {del.httpStatus || del.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-sm text-slate-500">{del.responseTime ? `${del.responseTime}ms` : "-"}</td>
                   <td className="px-6 py-4 text-right text-sm text-slate-500">{new Date(del.createdAt).toLocaleString()}</td>
                 </tr>
               )) : (
                 <tr>
                   <td colSpan={5} className="p-12 text-center text-slate-400">No delivery attempts found</td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add Webhook Endpoint</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Endpoint URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-api.com/webhooks"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Primary production webhook"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-emerald-500/20"
              >
                Add Endpoint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
