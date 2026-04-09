import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/services/analytics.service";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const distribution = await analyticsService.getPaymentMethodDistribution(auth.tenantId!);

    return NextResponse.json({
      success: true,
      distribution,
    }, {
      headers: {
        "Cache-Control": "private, max-age=300",
      }
    });
  } catch (error: any) {
    console.error("[API] Analytics Payment Methods GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
