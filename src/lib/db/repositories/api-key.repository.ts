import type { ApiKey, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class ApiKeyRepository extends BaseRepository<
  ApiKey,
  Prisma.ApiKeyCreateInput,
  Prisma.ApiKeyUpdateInput
> {
  protected readonly model = prisma.apiKey as unknown as {
    findUnique: (args: { where: { id: string } }) => Promise<ApiKey | null>;
    findMany: (args?: Record<string, unknown>) => Promise<ApiKey[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<ApiKey | null>;
    create: (args: { data: Prisma.ApiKeyCreateInput }) => Promise<ApiKey>;
    update: (args: {
      where: { id: string };
      data: Prisma.ApiKeyUpdateInput;
    }) => Promise<ApiKey>;
    delete: (args: { where: { id: string } }) => Promise<ApiKey>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findByKey(key: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({ where: { key } });
  }

  async findByUserId(userId: string): Promise<ApiKey[]> {
    return prisma.apiKey.findMany({ where: { userId } });
  }

  async updateLastUsed(id: string): Promise<ApiKey> {
    return prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
