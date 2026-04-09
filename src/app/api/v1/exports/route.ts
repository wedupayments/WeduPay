import { NextRequest, NextResponse } from "next/server";
import { exportService } from "@/services/export.service";
import { authenticateRequest, requireTenantAccess, requireAppUser } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const createExportJobSchema = z.object({
  type: z.enum(["TRANSACTIONS", "SETTLEMENTS", "ANALYTICS"]),
  format: z.enum(["CSV", "EXCEL"]),
  filters: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;
    const userError = requireAppUser(auth);
    if (userError) return userError;

    const body = await request.json();
    const validation = createExportJobSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Invalid export job request").body,
        { status: 400 }
      );
    }

    const { type, format, filters } = validation.data;
    const job = await exportService.createExportJob(
      auth.tenantId!,
      auth.userId!,
      type,
      format,
      filters || {}
    );

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error("[API] Export Job POST error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await exportService.listExportJobs(auth.tenantId!, { page, limit });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[API] Export Jobs GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
