import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const user = await prisma.user.findUnique({
      where: { id: auth.userId! },
      include: {
        wallets: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        references: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pendingApprovals = user.transactions.filter(
      (t) => t.status === "PENDING"
    ).length;

    const verifiedThisSemester = user.transactions
      .filter((t) => t.status === "COMPLETED" && t.type === "TUITION")
      .reduce((sum, t) => sum + t.amount, 0);

    const primaryMerchant = user.transactions.length > 0
      ? user.transactions[0].reference.split(" ")[0]
      : "None";

    const transactions = user.transactions.map((tx) => ({
      id: tx.id,
      merchant: tx.reference,
      purpose: tx.type,
      term: new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      date: new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      amount: `$${tx.amount.toFixed(2)}`,
      status: tx.status === "COMPLETED" ? "Verified" : tx.status === "PENDING" ? "Pending" : tx.status === "FAILED" ? "Failed" : "Processing",
    }));

    const references = user.references.map((ref) => ({
      id: ref.id,
      title: ref.title,
      ref: ref.referenceCode,
      icon: "school",
    }));

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
      references,
      transactions,
      wallets,
      user: {
        name: user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1),
        userId: user.id.slice(-5),
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
