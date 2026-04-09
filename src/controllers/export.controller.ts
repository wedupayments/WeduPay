import { NextResponse } from "next/server";
import { exportService } from "@/services/export.service";
import { createErrorResponse } from "@/lib/api-response";

export class ExportController {
  async listExports(request: Request, tenantId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");

      const result = await exportService.listExportJobs(tenantId, { page, limit });

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("[ExportController] listExports error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async getExport(request: Request, id: string, tenantId: string) {
    try {
      const job = await exportService.getExportJob(id, tenantId);
      if (!job) {
        return NextResponse.json(
          createErrorResponse("NOT_FOUND", "Export job not found").body,
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: job,
      });
    } catch (error: any) {
      console.error("[ExportController] getExport error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async createExport(request: Request, tenantId: string, userId: string) {
    try {
      const body = await request.json();
      const { type, format, filters } = body;

      if (!type || !format) {
        return NextResponse.json(
          createErrorResponse("VALIDATION_ERROR", "Type and format are required").body,
          { status: 400 }
        );
      }

      const job = await exportService.createExportJob(
        tenantId,
        userId,
        type,
        format,
        filters
      );

      return NextResponse.json({
        success: true,
        data: job,
      }, { status: 201 });
    } catch (error: any) {
      console.error("[ExportController] createExport error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }

  async downloadExport(request: Request, id: string, tenantId: string) {
    try {
      const job = await exportService.getExportJob(id, tenantId);
      if (!job || job.status !== "COMPLETED" || !job.fileUrl) {
        return NextResponse.json(
          createErrorResponse("NOT_FOUND", "Export file not ready or not found").body,
          { status: 404 }
        );
      }

      // In a real app, you might stream the file from S3/Storage here.
      // For now, we redirect to the fileUrl or return a signed URL.
      return NextResponse.redirect(new URL(job.fileUrl, request.url));
    } catch (error: any) {
      console.error("[ExportController] downloadExport error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", error.message).body,
        { status: 500 }
      );
    }
  }
}

export const exportController = new ExportController();
