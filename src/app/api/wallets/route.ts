import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const DEMO_WALLETS: Record<string, { walletType: string; currency: string; balance: number }[]> = {
  "customer-001": [
    { walletType: "EcoCash", currency: "USD", balance: 1240.0 },
    { walletType: "M-Pesa", currency: "USD", balance: 560.0 },
  ],
  "merchant-001": [
    { walletType: "M-Pesa", currency: "USD", balance: 2180.0 },
    { walletType: "MTN Mobile", currency: "USD", balance: 1890.0 },
  ],
  "admin-001": [
    { walletType: "Admin", currency: "USD", balance: 0.0 },
  ],
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId || !DEMO_WALLETS[userId]) {
      return NextResponse.json({ wallets: [] });
    }

    const wallets = DEMO_WALLETS[userId].map((w, i) => ({
      id: `${userId}-wallet-${i}`,
      ...w,
    }));

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Failed to fetch wallets:", error);
    return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { walletType, amount } = await request.json();

    if (!walletType || !amount) {
      return NextResponse.json({ error: "walletType and amount required" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Demo: Would fund ${walletType} with $${amount}` 
    });
  } catch (error) {
    console.error("Failed to fund wallet:", error);
    return NextResponse.json({ error: "Failed to fund wallet" }, { status: 500 });
  }
}
