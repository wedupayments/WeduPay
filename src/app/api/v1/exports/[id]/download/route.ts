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

    if (!job || job.tenantId !== auth.tenantId || job.status !== 'COMPLETED' || !job.fileUrl) {
      return NextResponse.json({ success: false, error: "Export file not ready or not found" }, { status: 404 });
    }

    // In a real app, this would redirect to a secure signed URL (S3/GCS)
    // For local dev, we just return the file path or a message
    return NextResponse.redirect(new URL(job.fileUrl, req.url));
  } catch (err) {
    console.error("Export download API error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
