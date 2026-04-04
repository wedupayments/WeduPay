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

    const { walletType, amount } = await request.json();

    if (!walletType || !amount) {
      return NextResponse.json({ error: "walletType and amount required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Authenticated wallet funding request received for ${walletType} with ${amount}`,
      userId: auth.userId,
    });
  } catch (error) {
    console.error("Failed to fund wallet:", error);
    return NextResponse.json({ error: "Failed to fund wallet" }, { status: 500 });
  }
}
