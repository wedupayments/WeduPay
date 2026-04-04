import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiResponse, createErrorResponse } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

function buildResourceUrl(request: Request, id?: string): string {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}/api/v1/wallets`;
  return id ? `${baseUrl}/${id}` : baseUrl;
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }
    const userId = auth.userId!;

    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency");
    const walletType = searchParams.get("walletType");

    let wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (currency) {
      wallets = wallets.filter((w) => w.currency === currency);
    }

    if (walletType) {
      wallets = wallets.filter((w) => w.walletType === walletType);
    }

    const formattedWallets = wallets.map((w) => ({
      id: w.id,
      type: "wallet",
      attributes: {
        walletType: w.walletType,
        currency: w.currency,
        balance: Number(w.balance),
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
