import { NextRequest, NextResponse } from "next/server";
import { analyticsService, Timeframe } from "@/services/analytics.service";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") || "DAILY") as Timeframe;

    const trend = await analyticsService.getSuccessRateTrend(auth.tenantId!, timeframe);

    return NextResponse.json({
      success: true,
      trend,
    }, {
      headers: {
        "Cache-Control": "private, max-age=300",
      }
    });
  } catch (error: any) {
    console.error("[API] Analytics Success Rate GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
