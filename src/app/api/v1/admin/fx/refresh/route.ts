import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAuth } from "@/lib/auth";
import {
  ensureOpenExchangeRatesFresh,
  getOpenExchangeRatesStatus,
  syncOpenExchangeRates,
} from "@/lib/open-exchange-rates";

const TRACKED_SYMBOLS = [
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
];

function requireAdmin(role: string | null) {
  return role === "ADMIN";
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) {
    return authError;
  }

  if (!requireAdmin(auth.role)) {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 }
    );
  }

  const refreshed = await ensureOpenExchangeRatesFresh(TRACKED_SYMBOLS);
  const status = await getOpenExchangeRatesStatus();

  return NextResponse.json({
    success: true,
    fx: {
      provider: "Open Exchange Rates",
      configured: status.configured,
      refreshed,
      trackedSymbols: TRACKED_SYMBOLS,
      count: status.count,
      latest: status.latest,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) {
    return authError;
  }

  if (!requireAdmin(auth.role)) {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 }
    );
  }

  if (!process.env.OPEN_EXCHANGE_RATES_APP_ID) {
    return NextResponse.json(
      {
        success: false,
        error: "OPEN_EXCHANGE_RATES_APP_ID is not configured",
      },
      { status: 400 }
    );
  }

  try {
    await syncOpenExchangeRates(TRACKED_SYMBOLS);
    const status = await getOpenExchangeRatesStatus();

    return NextResponse.json({
      success: true,
      message: "FX rates refreshed successfully",
      fx: {
        provider: "Open Exchange Rates",
        configured: status.configured,
        count: status.count,
        latest: status.latest,
      },
    });
  } catch (error) {
    console.error("[AdminFXRefresh] Failed to refresh rates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh FX rates",
      },
      { status: 500 }
    );
  }
}
