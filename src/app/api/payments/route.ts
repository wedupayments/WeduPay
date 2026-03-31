import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: List payments
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (PENDING, COMPLETED, FAILED)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Initiate a mobile money payment
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     reference:
 *                       type: string
 *                     providerRef:
 *                       type: string
 *                     status:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

const MOBILE_MONEY_PROVIDERS = ["EcoCash", "M-Pesa", "MTN"] as const;
type MobileMoneyProvider = typeof MOBILE_MONEY_PROVIDERS[number];

interface PaymentRequest {
  amount: number;
  currency: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  reference: string;
  description?: string;
}

async function initiateMobileMoneyPayment(payment: PaymentRequest): Promise<{
  success: boolean;
  transactionRef?: string;
  providerRef?: string;
  error?: string;
}> {
  const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  switch (payment.provider) {
    case "EcoCash":
      return {
        success: true,
        transactionRef,
        providerRef: `EC-${Date.now()}`,
      };
    case "M-Pesa":
      return {
        success: true,
        transactionRef,
        providerRef: `MP-${Date.now()}`,
      };
    case "MTN":
      return {
        success: true,
        transactionRef,
        providerRef: `MTN-${Date.now()}`,
      };
    default:
      return {
        success: false,
        error: "Invalid provider",
      };
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, string> = { userId };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
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

    const body: PaymentRequest = await request.json();
    const { amount, currency, provider, phoneNumber, reference, description } = body;

    if (!amount || !currency || !provider || !phoneNumber) {
      return NextResponse.json(
        { error: "amount, currency, provider, and phoneNumber are required" },
        { status: 400 }
      );
    }

    if (!MOBILE_MONEY_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${MOBILE_MONEY_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const paymentResult = await initiateMobileMoneyPayment({
      amount,
      currency,
      provider,
      phoneNumber,
      reference: reference || `PAY-${Date.now()}`,
      description,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || "Payment initiation failed" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency,
        status: "PENDING",
        type: "PAYMENT",
        reference: paymentResult.transactionRef!,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        providerRef: paymentResult.providerRef,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
      },
    });
  } catch (error) {
    console.error("Failed to process payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
