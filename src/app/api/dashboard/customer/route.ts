import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get user ID from query params (in production, get from auth session)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      // Return demo data if no userId provided
      return NextResponse.json({
        stats: {
          pendingApprovals: 0,
          verifiedThisSemester: "$0.00",
          primaryMerchant: "None",
        },
        references: [],
        transactions: [],
        wallets: [],
      });
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate stats
    const pendingApprovals = user.transactions.filter(
      (t) => t.status === "PENDING"
    ).length;

    const verifiedThisSemester = user.transactions
      .filter(
        (t) => t.status === "COMPLETED" && t.type === "PAYMENT"
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Get primary merchant (most frequent transaction recipient)
    const primaryMerchant = user.transactions.length > 0
      ? user.transactions[0].reference // In real app, this would be merchant name
      : "None";

    // Format transactions for dashboard
    const transactions = user.transactions.map((tx) => ({
      id: tx.id,
      merchant: tx.reference,
      purpose: tx.type,
      term: new Date(tx.createdAt).toLocaleDateString(),
      date: new Date(tx.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: `$${tx.amount.toFixed(2)}`,
      status:
        tx.status === "COMPLETED"
          ? "Verified"
          : tx.status === "PENDING"
          ? "Pending"
          : tx.status === "FAILED"
          ? "Failed"
          : "Processing",
    }));

    // Format wallets
    const wallets = user.wallets.map((w) => ({
      id: w.id,
      name: w.walletType,
      balance: `$${w.balance.toFixed(2)}`,
      currency: w.currency,
    }));

    return NextResponse.json({
      stats: {
        pendingApprovals,
        verifiedThisSemester: `$${verifiedThisSemester.toFixed(2)}`,
        primaryMerchant,
      },
      references: [], // Will be populated from payment_references table
      transactions,
      wallets,
      user: {
        name: user.email.split("@")[0],
        userId: user.id.slice(-5),
        email: user.email,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
