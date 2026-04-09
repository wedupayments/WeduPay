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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const currency = searchParams.get("currency") || undefined;
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;

    const result = await transactionService.getTransactions({
      tenantId: auth.tenantId!,
      page,
      limit,
      status: status as any,
      type: type as any,
      currency,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[API] Merchant Transactions GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
