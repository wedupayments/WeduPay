import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Note: Need Promise due to Next.js 15 params type change
) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) return authError;

    const profileError = requireAppUser(auth);
    if (profileError) return profileError;

    const { id } = await params;
    
    // In Next 14+, params properties must often be awaited or at least extracted properly 
    const cardId = id; 

    const { userId } = auth;
    const body = await request.json();
    const { amount, walletId } = body;

    if (!amount || amount <= 0 || !walletId) {
      return NextResponse.json({ error: "Amount and Wallet ID are required" }, { status: 400 });
    }

    // Use a transaction to ensure atomic updates
    try {
      const result = await prisma.$transaction(async (tx) => {
        const card = await tx.virtualCard.findFirst({
          where: { id: cardId, userId: userId! }
        });

        if (!card) throw new Error("Virtual card not found");

        const wallet = await tx.wallet.findFirst({
          where: { id: walletId, userId: userId! }
        });

        if (!wallet) throw new Error("Source wallet not found");

        // Mock conversion: assuming card is USD
        // In a real app we'd fetch actual rates between wallet.currency and card.currency
        let conversionRate = 1.0;
        if (wallet.currency !== card.currency) {
          // Simplistic mock rates for common African currencies to USD
          const rates: Record<string, number> = {
            'KES': 0.0076, // 1 KES to USD
            'ZWL': 0.0031,
            'ZAR': 0.053,
            'UGX': 0.00026,
            'GHS': 0.083
          };
          conversionRate = rates[wallet.currency] || 1.0;
        }

        const walletDeduction = Number(amount) / conversionRate;

        if (wallet.balance < walletDeduction) {
          throw new Error("Insufficient wallet balance");
        }

        // Deduct from wallet
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: walletDeduction } }
        });

        // Add to card
        const updatedCard = await tx.virtualCard.update({
          where: { id: cardId },
          data: { balance: { increment: Number(amount) } }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: userId!,
            amount: Number(amount),
            currency: card.currency,
            status: "COMPLETED",
            type: "CARD_FUNDING",
            reference: `Card Funding from ${wallet.walletType} (${wallet.currency})`,
          }
        });

        return updatedCard;
      });

      return NextResponse.json({
        success: true,
        message: `Card successfully funded from mobile wallet.`,
        data: result
      });
    } catch (txError: unknown) {
      const errorMessage = txError instanceof Error ? txError.message : "Transaction failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to fund card:", error);
    return NextResponse.json({ error: "Failed to fund card" }, { status: 500 });
  }
}
