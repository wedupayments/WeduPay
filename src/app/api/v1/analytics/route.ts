import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }
    const userId = auth.userId!;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
    const startDate = getStartDate(period);

    const [
      transactionStats,
      recentTransactions,
      walletBalances,
      webhookStats,
    ] = await Promise.all([
      getTransactionStats(userId, startDate),
      prisma.transaction.findMany({
        where: { userId, createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.wallet.findMany({
        where: { userId },
      }),
      prisma.webhookEvent.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const response = {
      data: {
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
      },
      _meta: {
        generatedAt: new Date().toISOString(),
        periodStart: startDate.toISOString(),
      },
      _links: {
        self: { href: `/api/v1/analytics?period=${period}` },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=300",
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch analytics", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "24h":
      now.setHours(now.getHours() - 24);
      break;
    case "7d":
      now.setDate(now.getDate() - 7);
      break;
    case "30d":
      now.setDate(now.getDate() - 30);
      break;
    case "90d":
      now.setDate(now.getDate() - 90);
      break;
    default:
      now.setDate(now.getDate() - 7);
  }
  return now;
}

async function getTransactionStats(userId: string, startDate: Date) {
  const [stats, byStatus, byType] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.transaction.groupBy({
      by: ["status"],
      where: { userId, createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, createdAt: { gte: startDate } },
      _count: true,
    }),
  ]);

  const totalAmount = await prisma.transaction.aggregate({
    where: { userId, createdAt: { gte: startDate } },
    _sum: { amount: true },
  });

  return {
    totalCount: stats._count,
    totalAmount: totalAmount._sum.amount || 0,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    byType: byType.map((t) => ({ type: t.type, count: t._count })),
  };
}
