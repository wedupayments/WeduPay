/**
 * PaymentRepository
 *
 * Previously missing from src/repositories/index.ts but referenced in service tests.
 * Backed by the Transaction model (payments are a subset of transactions).
 */

import type { Transaction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class PaymentRepository extends BaseRepository<
  Transaction,
  Prisma.TransactionCreateInput,
  Prisma.TransactionUpdateInput
> {
  protected readonly model = prisma.transaction as unknown as {
    findUnique: (args: { where: { id: string } }) => Promise<Transaction | null>;
    findMany: (args?: Record<string, unknown>) => Promise<Transaction[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<Transaction | null>;
    create: (args: { data: Prisma.TransactionCreateInput }) => Promise<Transaction>;
    update: (args: { where: { id: string }; data: Prisma.TransactionUpdateInput }) => Promise<Transaction>;
    delete: (args: { where: { id: string } }) => Promise<Transaction>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findPaymentsByUserId(
    userId: string,
    type: "PAYMENT" | "WITHDRAWAL" = "PAYMENT"
  ): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { userId, type },
      orderBy: { createdAt: "desc" },
    });
  }
}
