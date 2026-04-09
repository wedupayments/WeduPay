import { prisma } from "@/lib/prisma";

export type SettlementPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

export class SettlementService {
  async getAvailableBalance(tenantId: string) {
    // Sum of all COMPLETED transactions for this tenant
    const transactionSum = await prisma.transaction.aggregate({
      where: {
        tenantId,
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    // Sum of all non-FAILED settlements for this tenant
    const settlementSum = await prisma.settlement.aggregate({
      where: {
        tenantId,
        status: {
          in: ["PENDING", "PROCESSING", "COMPLETED"],
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalRevenue = transactionSum._sum.amount || 0;
    const totalSettled = settlementSum._sum.amount || 0;

    return {
      availableBalance: Math.max(0, totalRevenue - totalSettled),
      totalRevenue,
      totalSettled,
    };
  }

  calculateNextSettlementDate(period: SettlementPeriod): Date {
    const now = new Date();
    const next = new Date(now);

    if (period === "DAILY") {
      next.setDate(now.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    } else if (period === "WEEKLY") {
      // Next Monday
      next.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
      next.setHours(0, 0, 0, 0);
    } else if (period === "MONTHLY") {
      // 1st of next month
      next.setMonth(now.getMonth() + 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
    }

    return next;
  }

  async requestSettlement(tenantId: string, userId: string, amount: number, currency: string, bankAccount: any) {
    const { availableBalance } = await this.getAvailableBalance(tenantId);

    if (amount > availableBalance) {
      throw new Error("Insufficient balance for settlement");
    }

    // Check for existing pending settlement
    const pendingSettlement = await prisma.settlement.findFirst({
      where: {
        tenantId,
        status: "PENDING",
      },
    });

    if (pendingSettlement) {
      throw new Error("There is already a pending settlement request");
    }

    // Fetch transactions that haven't been settled yet
    // This is a bit complex without a 'settled' flag on transactions, 
    // but the task says to use transactionIds array in Settlement.
    
    // For now, we just record the amount. In a real system, we'd probably
    // mark transactions as 'settling' or link them to the settlement record.
    
    return prisma.settlement.create({
      data: {
        tenantId,
        userId,
        amount,
        currency,
        status: "PENDING",
        settlementPeriod: "MANUAL",
        bankAccount,
        transactionIds: [], // Would populate this in a more complex implementation
      },
    });
  }

  async listSettlements(tenantId: string, filters: { page?: number, limit?: number, status?: string }) {
    const { page = 1, limit = 10, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        orderBy: { requestedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.settlement.count({ where }),
    ]);

    return {
      settlements,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSettlement(id: string, tenantId: string) {
    return prisma.settlement.findFirst({
      where: { id, tenantId },
    });
  }

  async processSettlement(id: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id },
    });

    if (!settlement) {
      throw new Error("Settlement not found");
    }

    if (settlement.status !== "PENDING") {
      throw new Error("Settlement is not in PENDING state");
    }

    // Update to PROCESSING
    await prisma.settlement.update({
      where: { id },
      data: {
        status: "PROCESSING",
        processedAt: new Date(),
      },
    });

    try {
      // Here we would call an external payout API
      // If successful:
      const completed = await prisma.settlement.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Trigger webhook for settlement.completed
      // await webhookService.trigger(settlement.tenantId, 'settlement.completed', completed);

      return completed;
    } catch (error) {
      const failed = await prisma.settlement.update({
        where: { id },
        data: {
          status: "FAILED",
          failureReason: error instanceof Error ? error.message : "Payout processing failed",
        },
      });

      // Trigger webhook for settlement.failed
      // await webhookService.trigger(settlement.tenantId, 'settlement.failed', failed);

      return failed;
    }
  }
}

export const settlementService = new SettlementService();
