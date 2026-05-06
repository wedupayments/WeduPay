"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getOpenExchangeRatesProviderLabel } from "@/lib/open-exchange-rates";

type Rate = {
  from: string;
  to: string;
  rate: number;
  inverseRate?: number;
  source?: string;
  provider?: string;
  updatedAt?: string;
};

const FEATURED_PAIRS = [
  { from: "USD", to: "KES", label: "US Dollar to Kenya" },
  { from: "USD", to: "ZAR", label: "US Dollar to South Africa" },
  { from: "USD", to: "ZWL", label: "US Dollar to Zimbabwe" },
  { from: "KES", to: "UGX", label: "Kenya to Uganda" },
];

interface FXSnapshotProps {
  title?: string;
  subtitle?: string;
}

export function FXSnapshot({
  title = "FX Snapshot",
  subtitle = "Live exchange rates customers can use as a quick reference before funding or sending money.",
}: FXSnapshotProps) {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadRates = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/fx/rates");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load exchange rates");
        }

        if (active) {
          setRates(Array.isArray(data.rates) ? data.rates : []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load exchange rates");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRates();

    return () => {
      active = false;
    };
  }, []);

  const featuredRates = useMemo(() => {
    return FEATURED_PAIRS.map((pair) => {
      const match = rates.find(
        (rate) => rate.from === pair.from && rate.to === pair.to
      );

      return match ? { ...match, label: pair.label } : null;
    }).filter(Boolean) as Array<Rate & { label: string }>;
  }, [rates]);

  const latestUpdatedAt = useMemo(() => {
    return featuredRates
      .map((rate) => rate.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
  }, [featuredRates]);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            {subtitle}
          </p>
        </div>
        <Link
          href="/fx"
          className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-base">currency_exchange</span>
          View FX
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {error}
          </p>
        </div>
      ) : featuredRates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-5">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No exchange rates are available yet.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {featuredRates.map((rate) => (
              <div
                key={`${rate.from}-${rate.to}`}
                className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {rate.from}/{rate.to}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {rate.label}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">
                    trending_up
                  </span>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
                  {rate.rate.toFixed(4)}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  1 {rate.from} = {rate.rate.toFixed(4)} {rate.to}
                </p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {getOpenExchangeRatesProviderLabel(rate.source, rate.provider)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-primary/10 bg-slate-50 dark:bg-primary/5 px-4 py-3">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Rates are shown for guidance and can change before final payment confirmation.
            </p>
            {latestUpdatedAt && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Updated {new Date(latestUpdatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
