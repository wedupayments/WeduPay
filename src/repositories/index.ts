import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class BaseRepository<T> {
  protected model: any;

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findMany(args?: Prisma.Exact<any, any>): Promise<T[]> {
    return this.model.findMany(args);
  }

  async create(data: any): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async count(args?: Prisma.Exact<any, any>): Promise<number> {
    return this.model.count(args);
  }
}

export class UserRepository extends BaseRepository<any> {
  protected model = prisma.user;

  async findByEmail(email: string) {
    return this.model.findUnique({ where: { email } });
  }

  async findBySupabaseId(supabaseUserId: string) {
    return this.model.findUnique({ where: { supabaseUserId } });
  }

  async createWithSupabase(data: { email: string; phoneNumber: string; country: string; supabaseUserId: string }) {
    return this.model.create({
      data: {
        ...data,
        kycStatus: "pending",
      },
    });
  }
}

export class WalletRepository extends BaseRepository<any> {
  protected model = prisma.wallet;

  async findByUserId(userId: string) {
    return this.model.findMany({ where: { userId } });
  }

  async findByUserAndType(userId: string, walletType: string) {
    return this.model.findFirst({
      where: { userId, walletType },
    });
  }

  async updateBalance(id: string, amount: number) {
    return this.model.update({
      where: { id },
      data: { balance: { increment: amount } },
    });
  }
}

export class TransactionRepository extends BaseRepository<any> {
  protected model = prisma.transaction;

  async findByUserId(userId: string, args?: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = args || {};
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.model.count({ where }),
    ]);

    return { transactions, total, page, limit };
  }

  async findByReference(reference: string) {
    return this.model.findFirst({ where: { reference } });
  }

  async findPendingByUserId(userId: string) {
    return this.model.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class LedgerEntryRepository extends BaseRepository<any> {
  protected model = prisma.ledgerEntry;

  async findByTransactionId(transactionId: string) {
    return this.model.findMany({ where: { transactionId } });
  }

  async createEntry(data: {
    transactionId: string;
    accountId: string;
    entryType: "DEBIT" | "CREDIT";
    amount: number;
    currency: string;
  }) {
    return this.model.create({ data });
  }

  async createDoubleEntry(
    transactionId: string,
    debits: Array<{ accountId: string; amount: number; currency: string }>,
    credits: Array<{ accountId: string; amount: number; currency: string }>
  ) {
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

    return this.model.createMany({ data: entries });
  }

  async getAccountBalance(accountId: string, currency: string) {
    const result = await this.model.groupBy({
      by: ["entryType"],
      where: { accountId, currency },
      _sum: { amount: true },
    });

    const debits = result.find((r) => r.entryType === "DEBIT")?._sum.amount || 0;
    const credits = result.find((r) => r.entryType === "CREDIT")?._sum.amount || 0;

    return credits - debits;
  }
}

export class WebhookEventRepository extends BaseRepository<any> {
  protected model = prisma.webhookEvent;

  async findByProvider(provider: string, limit = 100) {
    return this.model.findMany({
      where: { provider },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findUnprocessed(limit = 50) {
    return this.model.findMany({
      where: { status: "RECEIVED" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async markProcessed(id: string) {
    return this.model.update({
      where: { id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  }

  async markFailed(id: string, error: string) {
    return this.model.update({
      where: { id },
      data: { status: "FAILED", errorMessage: error },
    });
  }
}

export class IdempotencyRepository extends BaseRepository<any> {
  protected model = prisma.idempotencyRecord;

  async findExisting(key: string, method: string, path: string) {
    return this.model.findFirst({
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
  }) {
    return this.model.create({ data });
  }
}

export class AuditLogRepository extends BaseRepository<any> {
  protected model = prisma.auditLog;

  async createLog(data: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId: string;
  }) {
    return this.model.create({ data });
  }

  async findByUserId(userId: string, limit = 100) {
    return this.model.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export class AsyncTaskRepository extends BaseRepository<any> {
  protected model = prisma.asyncTask;

  async findPending(limit = 10) {
    return this.model.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });
  }

  async markStarted(id: string) {
    return this.model.update({
      where: { id },
      data: { status: "PROCESSING", startedAt: new Date(), attempts: { increment: 1 } },
    });
  }

  async markCompleted(id: string, result: string) {
    return this.model.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date(), result },
    });
  }

  async markFailed(id: string, error: string) {
    const task = await this.model.findUnique({ where: { id } });
    const status = task && task.attempts >= task.maxAttempts ? "FAILED" : "PENDING";
    return this.model.update({
      where: { id },
      data: { status, errorMessage: error },
    });
  }
}

export class ApiKeyRepository extends BaseRepository<any> {
  protected model = prisma.apiKey;

  async findByKey(key: string) {
    return this.model.findUnique({
      where: { key },
    });
  }

  async findByUserId(userId: string) {
    return this.model.findMany({ where: { userId } });
  }

  async updateLastUsed(id: string) {
    return this.model.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}

export class PaymentReferenceRepository extends BaseRepository<any> {
  protected model = prisma.paymentReference;

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByReferenceCode(referenceCode: string) {
    return this.model.findUnique({ where: { referenceCode } });
  }
}
