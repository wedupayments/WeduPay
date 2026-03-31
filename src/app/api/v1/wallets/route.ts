import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createApiResponse, createErrorResponse } from "@/lib/api-response";

const DEMO_WALLETS: Record<string, { walletType: string; currency: string; balance: number }[]> = {
  "customer-001": [
    { walletType: "EcoCash", currency: "USD", balance: 1240.0 },
    { walletType: "M-Pesa", currency: "USD", balance: 560.0 },
  ],
  "merchant-001": [
    { walletType: "M-Pesa", currency: "USD", balance: 2180.0 },
    { walletType: "MTN Mobile", currency: "USD", balance: 1890.0 },
  ],
  "admin-001": [{ walletType: "Admin", currency: "USD", balance: 0.0 }],
};

function buildResourceUrl(request: Request, id?: string): string {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}/api/v1/wallets`;
  return id ? `${baseUrl}/${id}` : baseUrl;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency");
    const walletType = searchParams.get("walletType");

    let wallets = DEMO_WALLETS[userId] || [];

    if (currency) {
      wallets = wallets.filter((w) => w.currency === currency);
    }

    if (walletType) {
      wallets = wallets.filter((w) => w.walletType === walletType);
    }

    const formattedWallets = wallets.map((w, i) => ({
      id: `${userId}-wallet-${i}`,
      type: "wallet",
      attributes: {
        walletType: w.walletType,
        currency: w.currency,
        balance: w.balance,
      },
    }));

    const response = createApiResponse(formattedWallets, request);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch wallets:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch wallets", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
