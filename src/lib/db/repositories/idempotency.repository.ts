import type { IdempotencyRecord, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class IdempotencyRepository extends BaseRepository<
  IdempotencyRecord,
  Prisma.IdempotencyRecordCreateInput,
  Prisma.IdempotencyRecordUpdateInput
> {
  protected readonly model = prisma.idempotencyRecord as unknown as {
    findUnique: (args: { where: { id: string } }) => Promise<IdempotencyRecord | null>;
    findMany: (args?: Record<string, unknown>) => Promise<IdempotencyRecord[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<IdempotencyRecord | null>;
    create: (args: { data: Prisma.IdempotencyRecordCreateInput }) => Promise<IdempotencyRecord>;
    update: (args: { where: { id: string }; data: Prisma.IdempotencyRecordUpdateInput }) => Promise<IdempotencyRecord>;
    delete: (args: { where: { id: string } }) => Promise<IdempotencyRecord>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findExisting(
    key: string,
    method: string,
    path: string
  ): Promise<IdempotencyRecord | null> {
    return prisma.idempotencyRecord.findFirst({
      where: {
        idempotencyKey: key,
        method,
        path,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async createRecord(data: {
    idempotencyKey: string;
    method: string;
    path: string;
    statusCode: number;
    responseBody: string;
    expiresAt: Date;
  }): Promise<IdempotencyRecord> {
    return prisma.idempotencyRecord.create({ data });
  }
}
