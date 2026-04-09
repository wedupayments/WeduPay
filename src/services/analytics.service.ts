import { prisma } from "@/lib/prisma";
import { cacheService } from "./cache.service";

export type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export class AnalyticsService {
  async getRevenueOverTime(tenantId: string, timeframe: Timeframe = 'DAILY') {
    const cacheKey = `revenue_${timeframe}`;
    const cached = await cacheService.get(tenantId, cacheKey);
    if (cached) return cached;

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
      },
      select: {
        amount: true,
        currency: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
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
        buckets.push({
          date: key,
          revenues: [{ currency: tx.currency, amount: tx.amount }],
        });
      }
    }

    const result = buckets;

    await cacheService.set(tenantId, cacheKey, "REVENUE", result);
    return result;
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
          select: { metadata: true }
      });

      const distribution: Record<string, number> = {};
      transactions.forEach(tx => {
          const country = (tx.metadata as any)?.country || "Unknown";
          distribution[country] = (distribution[country] || 0) + 1;
      });

      const result = Object.entries(distribution).map(([country, count]) => ({ country, count }));
      await cacheService.set(tenantId, cacheKey, "GEOGRAPHIC", result);
      return result;
  }

  async getSuccessRateTrend(tenantId: string, timeframe: Timeframe = 'DAILY') {
      const cacheKey = `success_rate_${timeframe}`;
      const cached = await cacheService.get(tenantId, cacheKey);
      if (cached) return cached;

      const transactions = await prisma.transaction.findMany({
          where: { tenantId },
          select: { status: true, createdAt: true },
          orderBy: { createdAt: "asc" }
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
          if (tx.status === 'COMPLETED') data[key].successful++;
      }

      const result = Object.entries(data).map(([date, stats]) => ({
          date,
          successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
          total: stats.total
      }));

      await cacheService.set(tenantId, cacheKey, "SUCCESS_RATE", result);
      return result;
  }
}

export const analyticsService = new AnalyticsService();
