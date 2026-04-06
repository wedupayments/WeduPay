/**
 * ExchangeRateRepository
 *
 * Previously missing from src/repositories/index.ts but referenced in service tests.
 */

import type { ExchangeRate, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class ExchangeRateRepository extends BaseRepository<
  ExchangeRate,
  Prisma.ExchangeRateCreateInput,
  Prisma.ExchangeRateUpdateInput
> {
  protected readonly model = prisma.exchangeRate as unknown as {
    findUnique: (args: { where: { id: string } }) => Promise<ExchangeRate | null>;
    findMany: (args?: Record<string, unknown>) => Promise<ExchangeRate[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<ExchangeRate | null>;
    create: (args: { data: Prisma.ExchangeRateCreateInput }) => Promise<ExchangeRate>;
    update: (args: { where: { id: string }; data: Prisma.ExchangeRateUpdateInput }) => Promise<ExchangeRate>;
    delete: (args: { where: { id: string } }) => Promise<ExchangeRate>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findRate(
    baseCurrency: string,
    targetCurrency: string
  ): Promise<ExchangeRate | null> {
    return prisma.exchangeRate.findFirst({
      where: {
        baseCurrency,
        targetCurrency,
        isValid: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findAllValid(): Promise<ExchangeRate[]> {
    return prisma.exchangeRate.findMany({
      where: {
        isValid: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });
  }
}
