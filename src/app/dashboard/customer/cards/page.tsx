"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  nickname?: string;
}

interface WalletItem {
  id: string;
  walletType: string;
  currency: string;
  balance: number;
}

// ─── Brand config ─────────────────────────────────────────────────────────────

const CARD_BRANDS: Record<
  string,
  { gradient: string; chipColor: string; textSub: string; networkSvg: React.ReactNode }
> = {
  Visa: {
    gradient: "linear-gradient(135deg, #1a237e 0%, #283593 45%, #1565c0 100%)",
    chipColor: "#ffd54f",
    textSub: "rgba(255,255,255,0.65)",
    networkSvg: (
      <svg viewBox="0 0 48 16" fill="none" className="h-7 w-auto" aria-label="Visa">
        <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16" fill="white" letterSpacing="1">VISA</text>
      </svg>
    ),
  },
  Mastercard: {
    gradient: "linear-gradient(135deg, #212121 0%, #37474f 45%, #455a64 100%)",
    chipColor: "#ffd54f",
    textSub: "rgba(255,255,255,0.65)",
    networkSvg: (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-[#eb001b] opacity-90" />
        <div className="w-8 h-8 rounded-full bg-[#f79e1b] opacity-90 -ml-4" />
      </div>
    ),
  },
};

const WALLET_BRANDS: Record<string, { accent: string; logo: string }> = {
  mpesa:   { accent: "#43a047", logo: "/logos/mpesa.png" },
  ecocash: { accent: "#e53935", logo: "/logos/ecocash.png" },
  mtn:     { accent: "#f9a825", logo: "/logos/mtn-momo.png" },
};

function getCardBrand(provider: string) {
  return CARD_BRANDS[provider] ?? CARD_BRANDS["Visa"];
}

function getWalletBrand(walletType: string) {
  return WALLET_BRANDS[(walletType || '').toLowerCase()];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** EMV chip SVG */
function ChipSvg({ fill = "#ffd54f" }: { fill?: string }) {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
      <rect width="36" height="28" rx="4" fill={fill} />
      <rect x="10" y="0" width="2" height="28" fill="rgba(0,0,0,0.15)" />
      <rect x="24" y="0" width="2" height="28" fill="rgba(0,0,0,0.15)" />
      <rect x="0" y="8" width="36" height="2" fill="rgba(0,0,0,0.15)" />
      <rect x="0" y="18" width="36" height="2" fill="rgba(0,0,0,0.15)" />
      <rect x="10" y="8" width="16" height="12" rx="2" fill="rgba(0,0,0,0.12)" />
    </svg>
  );
}

/** Decorative circles overlay */
function CardCircles() {
  return (
    <>
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/[0.07] pointer-events-none" />
      <div className="absolute -bottom-14 -left-8 w-56 h-56 rounded-full bg-white/[0.05] pointer-events-none" />
    </>
  );
}

const providers = ["Visa", "Mastercard"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CardsPage() {
  const toast = useToast();
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [provider, setProvider] = useState("Visa");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [limit, setLimit] = useState("");
  const [fundAmount, setFundAmount] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [nickname, setNickname] = useState("");
  // Inline rename state
  const [renamingCard, setRenamingCard] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const loadCards = async () => {
      const response = await fetch("/api/cards");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load cards");
      const nextCards = (data.data ?? []).map(
        (item: { id: string; attributes: Omit<CardRecord, "id"> }) => ({ id: item.id, ...item.attributes })
      );
      setCards(nextCards);
    };

    const loadWallets = async () => {
      const response = await fetch("/api/wallets");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load wallets");
      const walletList = data.wallets || [];
      setWallets(walletList);
      if (walletList.length > 0 && !selectedWalletId) setSelectedWalletId(walletList[0].id);
    };

    const load = async () => {
      try {
        await Promise.all([loadCards(), loadWallets()]);
      } catch (error) {
        toast.error("Unable to load", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const refreshData = async () => {
    const [rc, rw] = await Promise.all([fetch("/api/cards"), fetch("/api/wallets")]);
    const [dc, dw] = await Promise.all([rc.json(), rw.json()]);
    if (rc.ok) {
      setCards(
        (dc.data ?? []).map((item: { id: string; attributes: Omit<CardRecord, "id"> }) => ({
          id: item.id,
          ...item.attributes,
        }))
      );
    }
    if (rw.ok) setWallets(dw.wallets || []);
  };

  const handleCreateCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          currency: selectedWallet?.currency || "USD",
          limit: limit ? Number(limit) : undefined,
          nickname: nickname || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create card");
      toast.success("Virtual card created", "Your new card is ready to fund.");
      setLimit("");
      setNickname("");
      await refreshData();
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
      if (!response.ok) throw new Error(data.error || "Failed to update card");
      toast.success("Card updated", data.message || "Card status updated.");
      await refreshData();
    } catch (error) {
      toast.error("Card update failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const commitRenameCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: renameValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to rename card");
      toast.success("Card renamed", "Personalized name updated.");
      await refreshData();
    } catch (error) {
      toast.error("Rename failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setRenamingCard(null);
    }
  };

  const handleFundCard = async (cardId: string) => {
    const amount = Number(fundAmount[cardId]);
    if (!amount || amount <= 0) { toast.error("Invalid amount", "Enter a valid amount to fund the card."); return; }
    if (!selectedWalletId) { toast.error("No wallet selected", "Please select a funding wallet."); return; }
    try {
      const response = await fetch(`/api/cards/${cardId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, walletId: selectedWalletId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fund card");
      toast.success("Card funded", data.message || "Your virtual card balance has been updated.");
      setFundAmount((current) => ({ ...current, [cardId]: "" }));
      await refreshData();
    } catch (error) {
      toast.error("Funding failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Virtual Cards</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Create cards for online payments and top them up directly from your wallet balances.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        {/* ── Create card form ─────────────────────────────────────────────── */}
        <form
          onSubmit={handleCreateCard}
          className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create a card</h2>
            <p className="mt-1 text-sm text-slate-500">Issue a new virtual card for controlled online spending.</p>
          </div>

          {/* Live card preview */}
          {(() => {
            const brand = getCardBrand(provider);
            return (
              <div
                className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl aspect-[1.586/1] flex flex-col justify-between select-none"
                style={{ background: brand.gradient }}
              >
                <CardCircles />
                <div className="relative z-10 flex items-start justify-between">
                  <ChipSvg fill={brand.chipColor} />
                  {brand.networkSvg}
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-medium mb-2" style={{ color: brand.textSub }}>
                    {nickname || "Virtual Card"} · Preview
                  </p>
                  <p className="text-lg font-mono font-semibold tracking-[0.22em]">
                    •••• •••• •••• ••••
                  </p>
                  <p className="text-xs mt-2" style={{ color: brand.textSub }}>
                    VALID THRU &nbsp; MM/YY
                  </p>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Network</label>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((item) => {
                const b = getCardBrand(item);
                const active = provider === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setProvider(item)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition ${
                      active ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                    }`}
                  >
                    <span className="inline-flex">{b.networkSvg}</span>
                    <span className="text-slate-700 dark:text-slate-200">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Funding wallet</label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
            >
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.walletType} ({wallet.currency}) · {wallet.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Spending limit <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
              placeholder="Unlimited"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Card nickname <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white"
              placeholder="e.g. Shopping Card"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating || wallets.length === 0}
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Creating card…" : "Create virtual card"}
          </button>
        </form>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Funding wallets summary */}
          <div className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Mobile Wallet Sources</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {wallets.map((wallet) => {
                const wb = getWalletBrand(wallet.walletType);
                return (
                  <div
                    key={wallet.id}
                    className="flex items-center gap-3 rounded-xl p-3 border"
                    style={wb ? { borderColor: `${wb.accent}44`, background: `${wb.accent}11` } : {}}
                  >
                    {wb ? (
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center p-1 shadow-sm"
                        style={{ background: `${wb.accent}22` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={wb.logo} alt={wallet.walletType} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">💰</div>
                    )}
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={wb ? { color: wb.accent } : { color: "inherit" }}
                      >
                        {wallet.walletType}
                      </p>
                      <p className="text-xs text-slate-500">
                        {wallet.currency} · {wallet.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card list */}
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
              cards.map((card) => {
                const brand = getCardBrand(card.provider);
                const isRenaming = renamingCard === card.id;
                const frozen = card.status === "FROZEN";
                const cancelled = card.status === "CANCELLED";

                return (
                  <div key={card.id} className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark shadow-sm overflow-hidden">
                    {/* Card visual */}
                    <div
                      className="relative overflow-hidden p-5 text-white"
                      style={{
                        background: frozen
                          ? "linear-gradient(135deg,#607d8b,#90a4ae)"
                          : cancelled
                          ? "linear-gradient(135deg,#424242,#757575)"
                          : brand.gradient,
                      }}
                    >
                      <CardCircles />
                      <div className="relative z-10 flex items-start justify-between mb-4">
                        <ChipSvg fill={frozen || cancelled ? "#cfd8dc" : brand.chipColor} />
                        <div className="opacity-90">{brand.networkSvg}</div>
                      </div>
                      <div className="relative z-10">
                        {/* Nickname editable inline */}
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRenameCard(card.id);
                              if (e.key === "Escape") setRenamingCard(null);
                            }}
                            onBlur={() => commitRenameCard(card.id)}
                            className="bg-white/20 border border-white/40 rounded-md px-2 py-0.5 text-white text-xs font-medium w-44 outline-none mb-1"
                            placeholder="Card nickname…"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setRenamingCard(card.id); setRenameValue(card.nickname || ""); }}
                            className="group flex items-center gap-1 mb-1"
                            title="Click to rename"
                          >
                            <span className="text-xs font-medium opacity-80">
                              {card.nickname || card.provider + " Card"}
                            </span>
                            <svg
                              className="w-3 h-3 opacity-0 group-hover:opacity-70 transition"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                            </svg>
                          </button>
                        )}

                        <p className="text-xl font-mono font-semibold tracking-[0.22em]">
                          •••• •••• •••• {card.lastFourDigits}
                        </p>
                        <div className="flex items-end justify-between mt-3">
                          <div>
                            <p className="text-[10px] opacity-60 uppercase tracking-widest">Valid thru</p>
                            <p className="text-sm font-semibold">
                              {card.expiryMonth}/{card.expiryYear}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] opacity-60 uppercase tracking-widest">Balance</p>
                            <p className="text-sm font-semibold">
                              {card.currency} {card.balance.toFixed(2)}
                            </p>
                          </div>
                          {/* Status badge */}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              frozen
                                ? "bg-blue-200/30 text-blue-100"
                                : cancelled
                                ? "bg-red-200/30 text-red-100"
                                : "bg-green-200/30 text-green-100"
                            }`}
                          >
                            {card.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card actions */}
                    <div className="p-4 border-t border-slate-100 dark:border-primary/10">
                      {card.limit && (
                        <p className="text-xs text-slate-400 mb-3">
                          Limit: {card.currency} {card.limit.toFixed(2)}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={fundAmount[card.id] ?? ""}
                          onChange={(e) =>
                            setFundAmount((current) => ({ ...current, [card.id]: e.target.value }))
                          }
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-36 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                          placeholder={`Amount (${card.currency})`}
                        />
                        <button
                          type="button"
                          onClick={() => handleFundCard(card.id)}
                          disabled={cancelled}
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background-dark transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Fund
                        </button>
                        {card.status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => handleCardAction(card.id, "FROZEN")}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                          >
                            Freeze
                          </button>
                        ) : card.status === "FROZEN" ? (
                          <button
                            type="button"
                            onClick={() => handleCardAction(card.id, "ACTIVE")}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                          >
                            Unfreeze
                          </button>
                        ) : null}
                        {!cancelled && (
                          <button
                            type="button"
                            onClick={() => handleCardAction(card.id, "CANCELLED")}
                            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
