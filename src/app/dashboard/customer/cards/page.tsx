"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";

interface CardRecord {
  id: string;
  provider: string;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  status: string;
  currency: string;
  balance: number;
  limit?: number;
}

interface WalletBalance {
  walletId: string;
  currency: string;
  availableBalance: number;
}

const providers = ["Visa", "Mastercard"];

export default function CardsPage() {
  const toast = useToast();
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [provider, setProvider] = useState("Visa");
  const [currency, setCurrency] = useState("USD");
  const [limit, setLimit] = useState("");
  const [fundAmount, setFundAmount] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadCards = async () => {
    const response = await fetch("/api/cards");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load cards");
    }

    const nextCards = (data.data ?? []).map((item: { id: string; attributes: Omit<CardRecord, "id"> }) => ({
      id: item.id,
      ...item.attributes,
    }));

    setCards(nextCards);
  };

  const loadWallets = async () => {
    const response = await fetch("/api/v1/wallets/balance?all=true");
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to load wallets");
    }

    setWallets(data.balances ?? []);
    if (data.balances?.length) {
      setCurrency(data.balances[0].currency);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([loadCards(), loadWallets()]);
      } catch (error) {
        toast.error("Unable to load virtual cards", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [toast]);

  const handleCreateCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          currency,
          limit: limit ? Number(limit) : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create card");
      }

      toast.success("Virtual card created", "Your new card is ready to fund.");
      setLimit("");
      await loadCards();
    } catch (error) {
      toast.error("Card creation failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCardAction = async (cardId: string, status: "ACTIVE" | "FROZEN" | "CANCELLED") => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: status === "CANCELLED" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: status === "CANCELLED" ? undefined : JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update card");
      }

      toast.success("Card updated", data.message || "Card status updated.");
      await loadCards();
    } catch (error) {
      toast.error("Card update failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleFundCard = async (cardId: string, fundingCurrency: string) => {
    const amount = Number(fundAmount[cardId]);
    if (!amount || amount <= 0) {
      toast.error("Invalid amount", "Enter a valid amount to fund the card.");
      return;
    }

    try {
      const response = await fetch(`/api/cards/${cardId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency: fundingCurrency }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fund card");
      }

      toast.success("Card funded", data.message || "Your virtual card balance has been updated.");
      setFundAmount((current) => ({ ...current, [cardId]: "" }));
      await Promise.all([loadCards(), loadWallets()]);
    } catch (error) {
      toast.error("Funding failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Virtual cards</h1>
        <p className="text-slate-600 dark:text-slate-400">Create cards for online payments and top them up directly from your wallet balances.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        <form onSubmit={handleCreateCard} className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create a card</h2>
            <p className="mt-1 text-sm text-slate-500">Issue a new virtual card for controlled online spending.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Provider</label>
            <select value={provider} onChange={(event) => setProvider(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white">
              {providers.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Funding currency</label>
            <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white">
              {wallets.map((wallet) => (
                <option key={wallet.walletId} value={wallet.currency}>
                  {wallet.currency} • available {wallet.availableBalance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Spending limit</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
              placeholder="Optional card limit"
            />
          </div>

          <button type="submit" disabled={isCreating || wallets.length === 0} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
            {isCreating ? "Creating card..." : "Create virtual card"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Wallets available for card funding</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {wallets.map((wallet) => (
                <div key={wallet.walletId} className="rounded-xl bg-slate-50 p-4 dark:bg-primary/5">
                  <p className="font-semibold text-slate-900 dark:text-white">{wallet.currency}</p>
                  <p className="text-sm text-slate-500">Available {wallet.availableBalance.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-8 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-primary/10 dark:bg-background-dark dark:text-slate-400">
                No cards yet. Create your first virtual card to start funding online payments.
              </div>
            ) : (
              cards.map((card) => (
                <div key={card.id} className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-wide text-slate-500">{card.provider}</div>
                      <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                        **** **** **** {card.lastFourDigits}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Expires {card.expiryMonth}/{card.expiryYear} • {card.currency} balance {card.balance.toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Status: {card.status}{card.limit ? ` • Limit ${card.limit.toFixed(2)}` : ""}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[160px_auto]">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={fundAmount[card.id] ?? ""}
                        onChange={(event) => setFundAmount((current) => ({ ...current, [card.id]: event.target.value }))}
                        className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                        placeholder={`Fund ${card.currency}`}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleFundCard(card.id, card.currency)} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-background-dark transition hover:brightness-110">
                          Fund
                        </button>
                        {card.status === "ACTIVE" ? (
                          <button type="button" onClick={() => handleCardAction(card.id, "FROZEN")} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                            Freeze
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleCardAction(card.id, "ACTIVE")} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                            Reactivate
                          </button>
                        )}
                        <button type="button" onClick={() => handleCardAction(card.id, "CANCELLED")} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
