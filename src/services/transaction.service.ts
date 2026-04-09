import { prisma } from "@/lib/prisma";

export interface TransactionFilter {
  tenantId?: string;
  userId?: string;
  status?: string;
  type?: string;
  currency?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface TransactionStats {
  totalCount: number;
  successfulCount: number;
  totalRevenue: number;
  currency: string;
}

export class TransactionService {
  async getTransactions(filter: TransactionFilter) {
    const {
      tenantId,
      userId,
      status,
      type,
      currency,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = filter;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (currency) where.currency = currency;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionStats(filter: Omit<TransactionFilter, "page" | "limit">): Promise<TransactionStats[]> {
    const { tenantId, userId, dateFrom, dateTo } = filter;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Get stats grouped by currency
    const stats = await prisma.transaction.groupBy({
      by: ["currency"],
      where,
      _count: {
        _all: true,
      },
    });

    // We also need successful count and revenue specifically
    const successfulStats = await prisma.transaction.groupBy({
      by: ["currency"],
      where: {
        ...where,
        status: "COMPLETED",
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    return stats.map((stat) => {
      const successful = successfulStats.find((s) => s.currency === stat.currency);
      return {
        totalCount: stat._count._all,
        successfulCount: successful?._count._all || 0,
        totalRevenue: successful?._sum.amount || 0,
        currency: stat.currency,
      };
    });
  }
}

export const transactionService = new TransactionService();
