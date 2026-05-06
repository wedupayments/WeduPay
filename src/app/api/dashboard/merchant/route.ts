import { NextResponse } from "next/server";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";
import { transactionService } from "@/services/transaction.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const tenantId = auth.tenantId!;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [statsArray, recentTxs, activeLinkCount, todayAggregate] = await Promise.all([
      transactionService.getTransactionStats({ tenantId }),
      transactionService.getTransactions({ tenantId, limit: 5 }),
      prisma.paymentLink.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.transaction.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          createdAt: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),
    ]);

    // Aggregate stats if multiple currencies exist, or pick the first one
    const stats = statsArray[0] || { totalRevenue: 0, totalCount: 0, successfulCount: 0, currency: "USD" };
    const revenueCurrency = stats.currency || "USD";


    // Format stats for frontend
    const dashboardData = {
      user: {
        name: auth.email?.split("@")[0] || "",
        email: auth.email,
        tenantName: auth.tenantName
      },
      stats: {
        totalRevenue: stats.totalCount > 0 ? `${stats.totalRevenue.toLocaleString()} ${revenueCurrency}` : "0.00",
        todayRevenue: `${(todayAggregate._sum.amount || 0).toLocaleString()} ${revenueCurrency}`,
        completedPayments: stats.successfulCount,
        pendingPayments: stats.totalCount - stats.successfulCount,
        successRate: stats.totalCount > 0 ? `${((stats.successfulCount / stats.totalCount) * 100).toFixed(1)}%` : "0%",
        activeLinks: activeLinkCount,
      },
      recentPayments: recentTxs.transactions.map(tx => ({
        id: tx.id,
        reference: tx.reference || `TX-${tx.id.slice(0, 8)}`,
        customer: (tx as any).user?.name || (tx as any).user?.email?.split("@")[0] || tx.reference || tx.id.slice(0, 8),
        amount: `${tx.amount.toLocaleString()} ${tx.currency}`,
        status: tx.status === "COMPLETED" ? "Verified" : tx.status === "PENDING" ? "Pending" : "Failed",
        date: tx.createdAt.toLocaleString(),
      })),
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error("Merchant dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant dashboard data", details: error.message },
      { status: 500 }
    );
  }
}
