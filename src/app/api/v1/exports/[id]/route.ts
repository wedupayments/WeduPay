import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { exportService } from "@/services/export.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await exportService.getExportJob(id, auth.tenantId!);

    if (!job || job.tenantId !== auth.tenantId) {
      return NextResponse.json({ success: false, error: "Export job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (err) {
    console.error("Export detail API error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
