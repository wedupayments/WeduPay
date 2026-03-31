import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * @swagger
 * /api/transfers:
 *   get:
 *     summary: List wallet-to-wallet transfers
 *     tags: [Transfers]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of transfers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transfers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Transfer funds between wallets
 *     tags: [Transfers]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *     responses:
 *       200:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transfer:
 *                   type: object
 *                   properties:
 *                     reference:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     status:
 *                       type: string
 *                     recipientUserId:
 *                       type: string
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Wallet not found
 */

interface TransferRequest {
  toUserId: string;
  amount: number;
  currency: string;
  walletType: string;
  description?: string;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transfers = await prisma.transaction.findMany({
      where: {
        userId,
        type: "TRANSFER",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("Failed to fetch transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TransferRequest = await request.json();
    const { toUserId, amount, currency, walletType, description } = body;

    if (!toUserId || !amount || !currency || !walletType) {
      return NextResponse.json(
        { error: "toUserId, amount, currency, and walletType are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (userId === toUserId) {
      return NextResponse.json(
        { error: "Cannot transfer to yourself" },
        { status: 400 }
      );
    }

    const [senderWallet, recipientWallet] = await Promise.all([
      prisma.wallet.findFirst({
        where: { userId, walletType, currency },
      }),
      prisma.wallet.findFirst({
        where: { userId: toUserId, walletType, currency },
      }),
    ]);

    if (!senderWallet) {
      return NextResponse.json(
        { error: "Sender wallet not found" },
        { status: 404 }
      );
    }

    if (senderWallet.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const result = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amount } },
      });

      if (recipientWallet) {
        await tx.wallet.update({
          where: { id: recipientWallet.id },
          data: { balance: { increment: amount } },
        });
      }

      const debitTransaction = await tx.transaction.create({
        data: {
          userId,
          amount,
          currency,
          status: "COMPLETED",
          type: "TRANSFER",
          reference,
        },
      });

      const creditTransaction = await tx.transaction.create({
        data: {
          userId: toUserId,
          amount,
          currency,
          status: "COMPLETED",
          type: "TRANSFER_RECEIVED",
          reference: `${reference}-RECV`,
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: debitTransaction.id,
            accountId: senderWallet.id,
            entryType: "DEBIT",
            amount,
            currency,
          },
          {
            transactionId: creditTransaction.id,
            accountId: recipientWallet?.id || toUserId,
            entryType: "CREDIT",
            amount,
            currency,
          },
        ],
      });

      return { debitTransaction, creditTransaction };
    });

    return NextResponse.json({
      success: true,
      transfer: {
        reference,
        amount,
        currency,
        status: "COMPLETED",
        description,
        recipientUserId: toUserId,
      },
      transactions: result,
    });
  } catch (error) {
    console.error("Failed to process transfer:", error);
    return NextResponse.json(
      { error: "Failed to process transfer" },
      { status: 500 }
    );
  }
}
