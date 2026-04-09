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

    const [statsArray, recentTxs, activeLinkCount] = await Promise.all([
      transactionService.getTransactionStats({ tenantId }),
      transactionService.getTransactions({ tenantId, limit: 5 }),
      prisma.paymentLink.count({ where: { tenantId, status: "ACTIVE" } })
    ]);

    // Aggregate stats if multiple currencies exist, or pick the first one
    const stats = statsArray[0] || { totalRevenue: 0, totalCount: 0, successfulCount: 0, currency: "USD" };


    // Format stats for frontend
    const dashboardData = {
      user: {
        name: auth.email?.split("@")[0] || "Merchant",
        email: auth.email,
        tenantName: auth.tenantName
      },
      stats: {
        totalRevenue: `${stats.totalRevenue.toLocaleString()} ${stats.totalCount > 0 ? "USD" : ""}`, // Simple formatting
        todayRevenue: "0.00", // Would need specific filtering for today
        completedPayments: stats.successfulCount,
        pendingPayments: stats.totalCount - stats.successfulCount,
        successRate: stats.totalCount > 0 ? `${((stats.successfulCount / stats.totalCount) * 100).toFixed(1)}%` : "0%",
        activeLinks: activeLinkCount,
      },
      recentPayments: recentTxs.transactions.map(tx => ({
        id: tx.id,
        reference: tx.reference || `TX-${tx.id.slice(0, 8)}`,
        customer: (tx as any).user?.name || "Unknown Customer",
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
