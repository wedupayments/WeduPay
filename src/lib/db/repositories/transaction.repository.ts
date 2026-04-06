import type { Transaction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export interface TransactionPage {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export class TransactionRepository extends BaseRepository<
  Transaction,
  Prisma.TransactionCreateInput,
  Prisma.TransactionUpdateInput
> {
  protected readonly model = prisma.transaction as unknown as {
    findUnique: (args: {
      where: { id: string };
    }) => Promise<Transaction | null>;
    findMany: (args?: Record<string, unknown>) => Promise<Transaction[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<Transaction | null>;
    create: (args: {
      data: Prisma.TransactionCreateInput;
    }) => Promise<Transaction>;
    update: (args: {
      where: { id: string };
      data: Prisma.TransactionUpdateInput;
    }) => Promise<Transaction>;
    delete: (args: { where: { id: string } }) => Promise<Transaction>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findByUserId(
    userId: string,
    options?: { page?: number; limit?: number; status?: string },
  ): Promise<TransactionPage> {
    const { page = 1, limit = 20, status } = options ?? {};
    const skip = (page - 1) * limit;
    const where: Prisma.TransactionWhereInput = { userId };
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, limit };
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return prisma.transaction.findFirst({ where: { reference } });
  }

  async findPendingByUserId(userId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
  }

  // Convenience: create from plain input (not Prisma relational shape)
  async createTransaction(data: {
    userId: string;
    amount: number;
    currency: string;
    type: string;
    reference: string;
    status: string;
    tenantId?: string | null;
  }): Promise<Transaction> {
    return prisma.transaction.create({
      data: {
        ...data,
        user: { connect: { id: data.userId } },
      },
    });
  }
}
