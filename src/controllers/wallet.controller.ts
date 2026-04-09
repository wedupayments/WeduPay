import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiResponse, createErrorResponse } from "@/lib/api-response";
import { walletService } from "@/services";

export class WalletController {
  // ── v1 list (merchant/user context) ──────────────────────────
  async list(request: Request, userId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const currency = searchParams.get("currency");
      const walletType = searchParams.get("walletType");

      let wallets = await prisma.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (currency) wallets = wallets.filter((w) => w.currency === currency);
      if (walletType) wallets = wallets.filter((w) => w.walletType === walletType);

      const formatted = wallets.map((w) => ({
        id: w.id,
        type: "wallet",
        attributes: {
          walletType: w.walletType,
          currency: w.currency,
          balance: Number(w.balance),
        },
      }));

      const response = createApiResponse(formatted, request);
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("[WalletController] list error:", error);
      const err = createErrorResponse("INTERNAL_ERROR", "Failed to fetch wallets", undefined, 500);
      return NextResponse.json(err.body, { status: err.status });
    }
  }

  // ── PaymentController-delegate (used by payment.controller) ──
  async listWallets(request: Request, userId: string) {
    try {
      const wallets = await walletService.getUserWallets(userId);
      return NextResponse.json({
        data: wallets.map((w) => ({
          id: w.id,
          type: "wallet",
          attributes: {
            walletType: w.walletType,
            currency: w.currency,
            balance: w.balance,
            createdAt: w.createdAt,
          },
        })),
      });
    } catch (error) {
      console.error("[WalletController] listWallets error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", "Failed to list wallets").body,
        { status: 500 }
      );
    }
  }

  async getWalletBalance(request: Request, params: { id: string }, userId: string) {
    try {
      const { id } = params;
      const wallet = await walletService.getWallet(userId, id);

      if (!wallet) {
        return NextResponse.json(
          createErrorResponse("NOT_FOUND", "Wallet not found").body,
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: {
          id: wallet.id,
          type: "wallet-balance",
          attributes: {
            walletType: wallet.walletType,
            currency: wallet.currency,
            balance: wallet.balance,
          },
        },
      });
    } catch (error) {
      console.error("[WalletController] getWalletBalance error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", "Failed to get wallet balance").body,
        { status: 500 }
      );
    }
  }
}

export const walletController = new WalletController();
