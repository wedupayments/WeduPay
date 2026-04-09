import { NextRequest, NextResponse } from "next/server";
import { transactionService } from "@/services/transaction.service";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;

    const stats = await transactionService.getTransactionStats({
      tenantId: auth.tenantId!,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("[API] Merchant Transactions Stats GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
