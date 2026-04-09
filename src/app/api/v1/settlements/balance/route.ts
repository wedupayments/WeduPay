import { NextRequest, NextResponse } from "next/server";
import { settlementService } from "@/services/settlement.service";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const balances = await settlementService.getAvailableBalance(auth.tenantId!);

    return NextResponse.json({
      success: true,
      balances,
    });
  } catch (error: any) {
    console.error("[API] Settlement Balance GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
