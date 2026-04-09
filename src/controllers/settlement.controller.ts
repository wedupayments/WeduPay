import { NextResponse } from "next/server";
import { settlementService } from "@/services/settlement.service";
import { createErrorResponse } from "@/lib/api-response";

export class SettlementController {
  async listSettlements(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const status = searchParams.get("status") || undefined;

      const result = await settlementService.listSettlements(tenantId, {
        page,
        limit,
        status,
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("[SettlementController] listSettlements error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async getSettlement(request: Request, id: string, tenantId: string) {
    try {
      const settlement = await settlementService.getSettlement(id, tenantId);
      if (!settlement) {
        return NextResponse.json(
          createErrorResponse("NOT_FOUND", "Settlement not found").body,
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: settlement,
      });
    } catch (error: any) {
      console.error("[SettlementController] getSettlement error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async requestSettlement(request: Request, tenantId: string, userId: string) {
    try {
      const body = await request.json();
      const { amount, currency, bankAccount } = body;

      if (!amount || !currency) {
        return NextResponse.json(
          createErrorResponse("VALIDATION_ERROR", "Amount and currency are required").body,
          { status: 400 }
        );
      }

      const settlement = await settlementService.requestSettlement(
        tenantId,
        userId,
        amount,
        currency,
        bankAccount
      );

      return NextResponse.json({
        success: true,
        settlement,
      }, { status: 201 });
    } catch (error: any) {
      console.error("[SettlementController] requestSettlement error:", error);
      const status = error.message.includes("Insufficient balance") ? 400 : 500;
      return NextResponse.json(
        createErrorResponse(status === 400 ? "INSUFFICIENT_FUNDS" : "INTERNAL_ERROR", error.message).body,
        { status }
      );
    }
  }

  async getBalance(request: Request, tenantId: string) {
    try {
      const balances = await settlementService.getAvailableBalance(tenantId);
      return NextResponse.json({
        success: true,
        balances,
      });
    } catch (error: any) {
      console.error("[SettlementController] getBalance error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }
}

export const settlementController = new SettlementController();
