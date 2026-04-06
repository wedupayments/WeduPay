import type { LedgerEntry, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

interface DoubleEntryLine {
  accountId: string;
  amount: number;
  currency: string;
}

export class LedgerEntryRepository extends BaseRepository<
  LedgerEntry,
  Prisma.LedgerEntryCreateInput,
  Prisma.LedgerEntryUpdateInput
> {
  protected readonly model = prisma.ledgerEntry as unknown as {
    findUnique: (args: { where: { id: string } }) => Promise<LedgerEntry | null>;
    findMany: (args?: Record<string, unknown>) => Promise<LedgerEntry[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<LedgerEntry | null>;
    create: (args: { data: Prisma.LedgerEntryCreateInput }) => Promise<LedgerEntry>;
    update: (args: { where: { id: string }; data: Prisma.LedgerEntryUpdateInput }) => Promise<LedgerEntry>;
    delete: (args: { where: { id: string } }) => Promise<LedgerEntry>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findByTransactionId(transactionId: string): Promise<LedgerEntry[]> {
    return prisma.ledgerEntry.findMany({ where: { transactionId } });
  }

  async createEntry(data: {
    transactionId: string;
    accountId: string;
    entryType: "DEBIT" | "CREDIT";
    amount: number;
    currency: string;
  }): Promise<LedgerEntry> {
    return prisma.ledgerEntry.create({ data });
  }

  async createDoubleEntry(
    transactionId: string,
    debits: DoubleEntryLine[],
    credits: DoubleEntryLine[]
  ): Promise<Prisma.BatchPayload> {
    const entries = [
      ...debits.map((d) => ({
        transactionId,
        accountId: d.accountId,
        entryType: "DEBIT",
        amount: d.amount,
        currency: d.currency,
      })),
      ...credits.map((c) => ({
        transactionId,
        accountId: c.accountId,
        entryType: "CREDIT",
        amount: c.amount,
        currency: c.currency,
      })),
    ];
    return prisma.ledgerEntry.createMany({ data: entries });
  }

  async getAccountBalance(
    accountId: string,
    currency: string
  ): Promise<number> {
    const result = await prisma.ledgerEntry.groupBy({
      by: ["entryType"],
      where: { accountId, currency },
      _sum: { amount: true },
    });

    const debits =
      result.find((r) => r.entryType === "DEBIT")?._sum.amount ?? 0;
    const credits =
      result.find((r) => r.entryType === "CREDIT")?._sum.amount ?? 0;

    return credits - debits;
  }
}
