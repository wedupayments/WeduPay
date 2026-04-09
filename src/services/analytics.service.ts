import { prisma } from "@/lib/prisma";
import { cacheService } from "./cache.service";

export type Timeframe = "DAILY" | "WEEKLY" | "MONTHLY";

export class AnalyticsService {
  // ═══════════════════════════════════════════════
  // Time-series analytics (original methods)
  // ═══════════════════════════════════════════════

  async getRevenueOverTime(tenantId: string, timeframe: Timeframe = "DAILY") {
    const cacheKey = `revenue_${timeframe}`;
    const cached = await cacheService.get(tenantId, cacheKey);
    if (cached) return cached;

    const transactions = await prisma.transaction.findMany({
      where: { tenantId, status: "COMPLETED" },
      select: { amount: true, currency: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const buckets: { date: string; revenues: { currency: string; amount: number }[] }[] = [];
    for (const tx of transactions) {
      let key = "";
      const date = new Date(tx.createdAt);
      if (isNaN(date.getTime())) continue;

      if (timeframe === "DAILY") {
        key = date.toISOString().split("T")[0];
      } else if (timeframe === "WEEKLY") {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        key = d.toISOString().split("T")[0];
      } else if (timeframe === "MONTHLY") {
        key = date.toISOString().substring(0, 7);
      }

      const existing = buckets.find((b) => b.date === key);
      if (existing) {
        const revenue = existing.revenues.find((r) => r.currency === tx.currency);
        if (revenue) {
          revenue.amount += tx.amount;
        } else {
          existing.revenues.push({ currency: tx.currency, amount: tx.amount });
        }
      } else {
        buckets.push({ date: key, revenues: [{ currency: tx.currency, amount: tx.amount }] });
      }
    }

    await cacheService.set(tenantId, cacheKey, "REVENUE", buckets);
    return buckets;
  }

  async getPaymentMethodDistribution(tenantId: string) {
    const cacheKey = "payment_methods";
    const cached = await cacheService.get(tenantId, cacheKey);
    if (cached) return cached;

    const stats = await prisma.transaction.groupBy({
      by: ["type"],
      where: { tenantId },
      _count: { _all: true },
      _sum: { amount: true },
    });

    const result = stats.map((s) => ({
      method: s.type,
      count: s._count._all,
      totalAmount: s._sum.amount || 0,
    }));

    await cacheService.set(tenantId, cacheKey, "PAYMENT_METHOD", result);
    return result;
  }

  async getGeographicDistribution(tenantId: string) {
    const cacheKey = "geographic";
    const cached = await cacheService.get(tenantId, cacheKey);
    if (cached) return cached;

    const transactions = await prisma.transaction.findMany({
      where: { tenantId },
      select: { metadata: true },
    });

    const distribution: Record<string, number> = {};
    transactions.forEach((tx) => {
      const country = (tx.metadata as any)?.country || "Unknown";
      distribution[country] = (distribution[country] || 0) + 1;
    });

    const result = Object.entries(distribution).map(([country, count]) => ({ country, count }));
    await cacheService.set(tenantId, cacheKey, "GEOGRAPHIC", result);
    return result;
  }

  async getSuccessRateTrend(tenantId: string, timeframe: Timeframe = "DAILY") {
    const cacheKey = `success_rate_${timeframe}`;
    const cached = await cacheService.get(tenantId, cacheKey);
    if (cached) return cached;

    const transactions = await prisma.transaction.findMany({
      where: { tenantId },
      select: { status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const data: Record<string, { total: number; successful: number }> = {};
    for (const tx of transactions) {
      let key = "";
      const date = new Date(tx.createdAt);
      if (isNaN(date.getTime())) continue;

      if (timeframe === "DAILY") {
        key = date.toISOString().split("T")[0];
      } else if (timeframe === "WEEKLY") {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        key = d.toISOString().split("T")[0];
      } else {
        key = date.toISOString().substring(0, 7);
      }

      if (!data[key]) data[key] = { total: 0, successful: 0 };
      data[key].total++;
      if (tx.status === "COMPLETED") data[key].successful++;
    }

    const result = Object.entries(data).map(([date, stats]) => ({
      date,
      successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      total: stats.total,
    }));

    await cacheService.set(tenantId, cacheKey, "SUCCESS_RATE", result);
    return result;
  }

  // ═══════════════════════════════════════════════
  // Dashboard / summary methods (used by controller)
  // ═══════════════════════════════════════════════

  async getDashboardSummary(tenantId: string, period: string = "30d") {
    const startDate = this.getStartDate(period);

    const [transactionStats, recentTransactions, walletBalances] = await Promise.all([
      this.getTransactionStats(tenantId, startDate),
      prisma.transaction.findMany({
        where: { tenantId, createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.wallet.findMany({ where: { tenantId } }),
    ]);

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      transactions: transactionStats,
      wallets: walletBalances.map((w) => ({
        id: w.id,
        type: w.walletType,
        currency: w.currency,
        balance: w.balance,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount,
        currency: t.currency,
        createdAt: t.createdAt,
      })),
    };
  }

  async getRevenueStats(tenantId: string, period: string) {
    const startDate = this.getStartDate(period);
    const revenue = await prisma.transaction.aggregate({
      where: { tenantId, status: "COMPLETED", createdAt: { gte: startDate } },
      _sum: { amount: true },
    });
    return { amount: revenue._sum.amount || 0, period };
  }

  async getTransactionVolume(tenantId: string, period: string) {
    const startDate = this.getStartDate(period);
    const stats = await prisma.transaction.aggregate({
      where: { tenantId, createdAt: { gte: startDate } },
      _count: true,
    });
    return { count: stats._count, period };
  }

  async getPaymentMethodStats(tenantId: string) {
    return this.getPaymentMethodDistribution(tenantId);
  }

  // ═══════════════════════════════════════════════
  // Private helpers
  // ═══════════════════════════════════════════════

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case "24h":  now.setHours(now.getHours() - 24); break;
      case "7d":   now.setDate(now.getDate() - 7);    break;
      case "30d":  now.setDate(now.getDate() - 30);   break;
      case "90d":  now.setDate(now.getDate() - 90);   break;
      default:     now.setDate(now.getDate() - 7);
    }
    return now;
  }

  private async getTransactionStats(tenantId: string, startDate: Date) {
    const [stats, byStatus, byType] = await Promise.all([
      prisma.transaction.aggregate({
        where: { tenantId, createdAt: { gte: startDate } },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ["status"],
        where: { tenantId, createdAt: { gte: startDate } },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { tenantId, createdAt: { gte: startDate } },
        _count: true,
      }),
    ]);

    const totalAmount = await prisma.transaction.aggregate({
      where: { tenantId, createdAt: { gte: startDate } },
      _sum: { amount: true },
    });

    return {
      totalCount: stats._count,
      totalAmount: totalAmount._sum.amount || 0,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byType:   byType.map((t) => ({ type: t.type, count: t._count })),
    };
  }
}

export const analyticsService = new AnalyticsService();
