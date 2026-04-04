"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface ReferenceItem {
  id: string;
  title: string;
  ref: string;
  icon: string;
}

interface CardSummary {
  id: string;
  attributes: {
    provider: string;
    lastFourDigits: string;
    balance: number;
    currency: string;
    status: string;
  };
}

export default function PaymentsPage() {
  const toast = useToast();
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardResponse, cardsResponse] = await Promise.all([
          fetch("/api/dashboard/customer"),
          fetch("/api/cards"),
        ]);

        const dashboardData = await dashboardResponse.json();
        const cardsData = await cardsResponse.json();

        if (!dashboardResponse.ok) {
          throw new Error(dashboardData.error || "Failed to load payment references");
        }

        if (!cardsResponse.ok) {
          throw new Error(cardsData.error || "Failed to load cards");
        }

        setReferences(dashboardData.references ?? []);
        setCards(cardsData.data ?? []);
      } catch (error) {
        toast.error("Unable to load payments", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [toast]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments workspace</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage tuition references, wallet funding, and virtual cards from one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/customer/funding" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-background-dark transition hover:brightness-110">
            Fund wallet
          </Link>
          <Link href="/dashboard/customer/cards" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
            Manage cards
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payment references</h2>
                <p className="mt-1 text-sm text-slate-500">Use these references when sending tuition, fees, and course-related payments.</p>
              </div>
              <Link href="/dashboard/customer/history" className="text-sm font-medium text-primary hover:underline">
                View history
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {references.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-primary/10 dark:text-slate-400">
                  No payment references available yet.
                </div>
              ) : (
                references.map((reference) => (
                  <div key={reference.id} className="rounded-xl bg-slate-50 p-4 dark:bg-primary/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{reference.title}</p>
                        <p className="mt-1 text-sm text-slate-500">Reference code: {reference.ref}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Ready
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Card payment access</h2>
            <p className="mt-1 text-sm text-slate-500">Use your virtual cards for online merchants and education platforms that require card checkout.</p>

            <div className="mt-5 space-y-3">
              {cards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-primary/10 dark:text-slate-400">
                  No virtual cards yet. Create one to start making online payments.
                </div>
              ) : (
                cards.map((card) => (
                  <div key={card.id} className="rounded-xl bg-slate-50 p-4 dark:bg-primary/5">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {card.attributes.provider} ending in {card.attributes.lastFourDigits}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {card.attributes.currency} {card.attributes.balance.toFixed(2)} • {card.attributes.status}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 rounded-xl bg-primary/5 p-4 text-sm text-slate-600 dark:text-slate-300">
              Virtual card support was one of the live GitHub backlog items, and this page now surfaces the card experience directly inside the customer area.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
