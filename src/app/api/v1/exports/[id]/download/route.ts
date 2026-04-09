import { NextRequest, NextResponse } from "next/server";
import { exportController } from "@/controllers/export.controller";
import { authenticateRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  return exportController.downloadExport(request, id, auth.tenantId!);
}
