import { prisma } from "@/lib/prisma";
import { Parser } from "json2csv";
import * as ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export type ExportType = "TRANSACTIONS" | "SETTLEMENTS" | "PAYMENT_LINKS" | "ANALYTICS";
export type ExportFormat = "CSV" | "EXCEL";

export class ExportService {
  private exportsDir = path.join(process.cwd(), "public", "exports");

  constructor() {
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  async listExportJobs(tenantId: string, filters: { page?: number, limit?: number }) {
    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.exportJob.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.exportJob.count({ where: { tenantId } }),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getExportJob(id: string, tenantId: string) {
    return prisma.exportJob.findFirst({
      where: { id, tenantId },
    });
  }

  async createExportJob(tenantId: string, userId: string, type: ExportType, format: ExportFormat, filters: any) {
    const job = await prisma.exportJob.create({
      data: {
        tenantId,
        userId,
        type,
        format,
        filters,
        status: "PENDING",
      },
    });

    // Create AsyncTask for background processing
    await prisma.asyncTask.create({
      data: {
        type: "EXPORT_GENERATION",
        payload: JSON.stringify({ jobId: job.id }),
        status: "PENDING",
      },
    });

    return job;
  }

  async processExportJob(jobId: string) {
    const job = await prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new Error("Export job not found");

    await prisma.exportJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    try {
      let data: any[] = [];
      const filters = job.filters as any;

      // Fetch data based on type
      if (job.type === "TRANSACTIONS") {
        data = await prisma.transaction.findMany({
          where: {
            tenantId: job.tenantId,
            ...(filters.status && { status: filters.status }),
            ...(filters.dateFrom && { createdAt: { gte: new Date(filters.dateFrom) } }),
            ...(filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } }),
          },
          include: { user: true },
        });
      } else if (job.type === "SETTLEMENTS") {
        data = await prisma.settlement.findMany({
          where: {
            tenantId: job.tenantId,
            ...(filters.status && { status: filters.status }),
          },
        });
      } else if (job.type === "PAYMENT_LINKS") {
          data = await prisma.paymentLink.findMany({
              where: {
                  tenantId: job.tenantId
              }
          })
      }

      const fileName = `${job.type.toLowerCase()}_${jobId}_${Date.now()}.${job.format === "CSV" ? "csv" : "xlsx"}`;
      const filePath = path.join(this.exportsDir, fileName);
      const fileUrl = `/exports/${fileName}`;

      if (job.format === "CSV") {
        await this.generateCSV(data, filePath);
      } else {
        await this.generateExcel(data, job.type, filePath);
      }

      const stats = fs.statSync(filePath);

      return await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          fileUrl,
          fileSize: stats.size,
          recordCount: data.length,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          completedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Export process error:", error);
      return await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Export failed",
          completedAt: new Date(),
        },
      });
    }
  }

  private async generateCSV(data: any[], filePath: string) {
    if (data.length === 0) {
        fs.writeFileSync(filePath, "No data found for this export");
        return;
    }
    
    const parser = new Parser();
    const csv = parser.parse(data);
    fs.writeFileSync(filePath, csv);
  }

  private async generateExcel(data: any[], type: string, filePath: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    if (data.length > 0) {
      const columns = Object.keys(data[0]).map((key) => ({
        header: key.charAt(0).toUpperCase() + key.slice(1),
        key: key,
        width: 20,
      }));
      worksheet.columns = columns;
      worksheet.addRows(data);
    } else {
      worksheet.addRow(["No data found for this export"]);
    }

    await workbook.xlsx.writeFile(filePath);
  }

  async cleanupExpiredExports() {
    const expiredJobs = await prisma.exportJob.findMany({
      where: {
        expiresAt: { lt: new Date() },
        fileUrl: { not: null },
      },
    });

    for (const job of expiredJobs) {
      if (job.fileUrl) {
        const filePath = path.join(process.cwd(), "public", job.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    return prisma.exportJob.updateMany({
      where: { expiresAt: { lt: new Date() } },
      data: { fileUrl: null },
    });
  }
}

export const exportService = new ExportService();
