import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Failed to fetch wallets:", error);
    return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, walletType, amount } = await request.json();

    if (!userId || !walletType || !amount) {
      return NextResponse.json(
        { error: "userId, walletType, and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const wallet = await prisma.wallet.update({
      where: { id: walletType },
      data: { balance: { increment: amount } },
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: wallet.currency,
        status: "COMPLETED",
        type: "FUNDING",
        reference: `FUND-${walletType.slice(-8)}-${Date.now()}`,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        transactionId: transaction.id,
        accountId: wallet.id,
        entryType: "CREDIT",
        amount,
        currency: wallet.currency,
      },
    });

    return NextResponse.json({ success: true, wallet, transaction });
  } catch (error) {
    console.error("Failed to fund wallet:", error);
    return NextResponse.json({ error: "Failed to fund wallet" }, { status: 500 });
  }
}
