import type { AuditLog, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class AuditLogRepository extends BaseRepository<
  AuditLog,
  Prisma.AuditLogCreateInput,
  Prisma.AuditLogUpdateInput
> {
  protected readonly model = prisma.auditLog as unknown as {
    findUnique: (args: { where: { id: string } }) => Promise<AuditLog | null>;
    findMany: (args?: Record<string, unknown>) => Promise<AuditLog[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<AuditLog | null>;
    create: (args: { data: Prisma.AuditLogCreateInput }) => Promise<AuditLog>;
    update: (args: { where: { id: string }; data: Prisma.AuditLogUpdateInput }) => Promise<AuditLog>;
    delete: (args: { where: { id: string } }) => Promise<AuditLog>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async createLog(data: {
    userId?: string;
    tenantId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId: string;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  }

  async findByUserId(userId: string, limit = 100): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
