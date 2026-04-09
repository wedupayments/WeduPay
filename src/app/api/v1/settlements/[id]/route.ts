import { NextRequest, NextResponse } from "next/server";
import { settlementService } from "@/services/settlement.service";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const { id } = await params;
    const settlement = await settlementService.getSettlement(id, auth.tenantId!);

    if (!settlement) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Settlement not found").body,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settlement,
    });
  } catch (error: any) {
    console.error("[API] Settlement Detail GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
