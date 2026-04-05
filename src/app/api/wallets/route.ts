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
    const userId = auth.userId!;

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
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    const { walletId, amount } = await request.json();

    if (!walletId || !amount) {
      return NextResponse.json({ error: "walletId and amount required" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId: auth.userId! }
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: Number(amount) } }
    });

    return NextResponse.json({
      success: true,
      message: `Wallet funded successfully. New balance: $${updatedWallet.balance}`,
      userId: auth.userId,
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error("Failed to fund wallet:", error);
    return NextResponse.json({ error: "Failed to fund wallet" }, { status: 500 });
  }
}
