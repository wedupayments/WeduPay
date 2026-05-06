import { prisma } from "@/lib/prisma";

const OPEN_EXCHANGE_RATES_BASE_URL = "https://openexchangerates.org/api";
const DEFAULT_SYMBOLS = [
  "USD",
  "EUR",
  "GBP",
  "KES",
  "NGN",
  "GHS",
  "ZAR",
  "TZS",
  "UGX",
  "ZMW",
  "XOF",
  "XAF",
  "MZN",
  "ZWL",
] as const;
const STALE_AFTER_MS = 55 * 60 * 1000;

type LatestRatesResponse = {
  disclaimer?: string;
  license?: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
};

function getAppId(): string {
  return process.env.OPEN_EXCHANGE_RATES_APP_ID || "";
}

function hasConfiguredAppId(): boolean {
  return Boolean(getAppId());
}

function pairKey(baseCurrency: string, targetCurrency: string): string {
  return `${baseCurrency.toUpperCase()}_${targetCurrency.toUpperCase()}`;
}

function getTrackedSymbols(extraSymbols: string[] = []): string[] {
  return Array.from(
    new Set(
      [...DEFAULT_SYMBOLS, ...extraSymbols.map((symbol) => symbol.toUpperCase())].filter(Boolean)
    )
  );
}

function buildLatestUrl(symbols: string[]): string {
  const params = new URLSearchParams({
    app_id: getAppId(),
    prettyprint: "0",
    symbols: symbols.join(","),
  });

  return `${OPEN_EXCHANGE_RATES_BASE_URL}/latest.json?${params.toString()}`;
}

function getCrossRate(
  rates: Record<string, number>,
  baseCurrency: string,
  targetCurrency: string
): number | null {
  const base = baseCurrency.toUpperCase();
  const target = targetCurrency.toUpperCase();

  if (base === target) {
    return 1;
  }

  if (base === "USD") {
    return rates[target] ?? null;
  }

  if (target === "USD") {
    const baseRate = rates[base];
    return baseRate ? 1 / baseRate : null;
  }

  const baseRate = rates[base];
  const targetRate = rates[target];

  if (!baseRate || !targetRate) {
    return null;
  }

  return targetRate / baseRate;
}

async function fetchLatestRates(symbols: string[]): Promise<LatestRatesResponse> {
  if (!hasConfiguredAppId()) {
    throw new Error("OPEN_EXCHANGE_RATES_APP_ID is not configured");
  }

  const response = await fetch(buildLatestUrl(symbols), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  const data = (await response.json()) as LatestRatesResponse & {
    error?: boolean;
    message?: string;
    description?: string;
    status?: number;
  };

  if (!response.ok || data.error) {
    throw new Error(data.description || data.message || "Open Exchange Rates request failed");
  }

  return data;
}

async function getLatestStoredUpdate(source = "open_exchange_rates") {
  return prisma.exchangeRate.findFirst({
    where: {
      source,
      provider: "openexchangerates",
      isValid: true,
    },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
}

export async function getOpenExchangeRatesStatus() {
  const latest = await prisma.exchangeRate.findFirst({
    where: {
      source: "open_exchange_rates",
      provider: "openexchangerates",
      isValid: true,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      updatedAt: true,
      validUntil: true,
      baseCurrency: true,
      targetCurrency: true,
      rate: true,
    },
  });

  const count = await prisma.exchangeRate.count({
    where: {
      source: "open_exchange_rates",
      provider: "openexchangerates",
      isValid: true,
    },
  });

  return {
    configured: hasConfiguredAppId(),
    count,
    latest,
  };
}

export async function syncOpenExchangeRates(symbols: string[] = []): Promise<boolean> {
  if (!hasConfiguredAppId()) {
    return false;
  }

  const trackedSymbols = getTrackedSymbols(symbols).filter((symbol) => symbol !== "USD");
  const latest = await fetchLatestRates(getTrackedSymbols(symbols));
  const timestamp = new Date(latest.timestamp * 1000);
  const validUntil = new Date(timestamp.getTime() + 60 * 60 * 1000);

  await Promise.all(
    trackedSymbols
      .map((targetCurrency) => latest.rates[targetCurrency])
      .map((rateValue, index) => ({ rateValue, targetCurrency: trackedSymbols[index] }))
      .filter((entry) => typeof entry.rateValue === "number" && entry.rateValue > 0)
      .map(({ rateValue, targetCurrency }) =>
        prisma.exchangeRate.upsert({
          where: {
            baseCurrency_targetCurrency_source_provider: {
              baseCurrency: "USD",
              targetCurrency,
              source: "open_exchange_rates",
              provider: "openexchangerates",
            },
          },
          update: {
            rate: rateValue!,
            inverseRate: 1 / rateValue!,
            isValid: true,
            validFrom: timestamp,
            validUntil,
            updatedAt: timestamp,
          },
          create: {
            baseCurrency: "USD",
            targetCurrency,
            rate: rateValue!,
            inverseRate: 1 / rateValue!,
            source: "open_exchange_rates",
            provider: "openexchangerates",
            isValid: true,
            validFrom: timestamp,
            validUntil,
            spread: 0.01,
            margin: 0.005,
          },
        })
      )
  );

  return true;
}

export async function ensureOpenExchangeRatesFresh(symbols: string[] = []): Promise<boolean> {
  if (!hasConfiguredAppId()) {
    return false;
  }

  const latestStored = await getLatestStoredUpdate();
  const isFresh =
    latestStored && Date.now() - latestStored.updatedAt.getTime() < STALE_AFTER_MS;

  if (isFresh) {
    return true;
  }

  try {
    return await syncOpenExchangeRates(symbols);
  } catch (error) {
    console.error("[OpenExchangeRates] Failed to sync latest rates:", error);
    return false;
  }
}

export async function getOpenExchangeRatePair(
  baseCurrency: string,
  targetCurrency: string
): Promise<{
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  inverseRate: number;
  source: string;
  provider: string;
  timestamp: Date;
} | null> {
  const base = baseCurrency.toUpperCase();
  const target = targetCurrency.toUpperCase();

  if (base === target) {
    return {
      baseCurrency: base,
      targetCurrency: target,
      rate: 1,
      inverseRate: 1,
      source: "open_exchange_rates",
      provider: "openexchangerates",
      timestamp: new Date(),
    };
  }

  if (!hasConfiguredAppId()) {
    return null;
  }

  const latest = await fetchLatestRates(getTrackedSymbols([base, target]));
  const rate = getCrossRate(latest.rates, base, target);

  if (!rate) {
    return null;
  }

  return {
    baseCurrency: base,
    targetCurrency: target,
    rate,
    inverseRate: 1 / rate,
    source: "open_exchange_rates",
    provider: "openexchangerates",
    timestamp: new Date(latest.timestamp * 1000),
  };
}

export function getOpenExchangeRatesProviderLabel(source?: string, provider?: string): string {
  if (provider === "openexchangerates" || source === "open_exchange_rates") {
    return "Open Exchange Rates";
  }

  return source || "Market rate";
}

export const openExchangeRates = {
  hasConfiguredAppId,
  ensureOpenExchangeRatesFresh,
  syncOpenExchangeRates,
  getOpenExchangeRatePair,
  getOpenExchangeRatesProviderLabel,
  getOpenExchangeRatesStatus,
  pairKey,
};
