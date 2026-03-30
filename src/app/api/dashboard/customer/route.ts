import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("wedupay-user-email")?.value;
    const userId = cookieStore.get("wedupay-user-id")?.value;

    let user = null;

    if (userEmail) {
      user = await prisma.user.findUnique({
        where: { email: decodeURIComponent(userEmail) },
        include: {
          wallets: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          references: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({
        stats: {
          pendingApprovals: 2,
          verifiedThisSemester: "$1,240.00",
          primaryMerchant: "BYU-Pathway",
        },
        references: [
          { id: "1", title: "BYU-Pathway Worldwide", ref: "BYU-2024-88291", icon: "school" },
          { id: "2", title: "Course Materials Fund", ref: "MAT-BK-2024", icon: "menu_book" },
        ],
        transactions: [
          { id: "1", merchant: "BYU-Pathway Tuition", purpose: "TUITION", term: "Winter 2024", date: "Mar 15, 2026", amount: "$450.00", status: "Verified" },
          { id: "2", merchant: "Application Fee", purpose: "FEE", term: "Global Enrollment", date: "Mar 10, 2026", amount: "$35.00", status: "Pending" },
        ],
        wallets: [],
        user: {
          name: "Guest User",
          userId: "00000",
          email: "",
        },
      });
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
