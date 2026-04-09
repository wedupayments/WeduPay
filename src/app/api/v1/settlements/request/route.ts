import { NextRequest, NextResponse } from "next/server";
import { settlementService } from "@/services/settlement.service";
import { authenticateRequest, requireTenantAccess, requireAppUser } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const requestSettlementSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  bankAccount: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;
    const userError = requireAppUser(auth);
    if (userError) return userError;

    const body = await request.json();
    const validation = requestSettlementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Invalid settlement request").body,
        { status: 400 }
      );
    }

    const { amount, currency, bankAccount } = validation.data;
    const settlement = await settlementService.requestSettlement(
      auth.tenantId!,
      auth.userId!,
      amount,
      currency,
      bankAccount
    );

    return NextResponse.json({
      success: true,
      settlement,
    });
  } catch (error: any) {
    console.error("[API] Settlement Request POST error:", error);
    const status = error.message.includes("Insufficient balance") ? 400 : 500;
    return NextResponse.json(
      createErrorResponse(status === 400 ? "INSUFFICIENT_FUNDS" : "INTERNAL_ERROR", error.message).body,
      { status }
    );
  }
}
