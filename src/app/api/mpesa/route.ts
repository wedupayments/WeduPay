import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mpesaAPI } from "@/lib/mpesa";
import { createErrorResponse } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

type MpesaTransactionMetadata = {
  provider: "MPESA";
  phoneNumber: string;
  walletId?: string;
  description?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  transactionReceipt?: string;
  credited?: boolean;
  providerResponse?: unknown;
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

async function completeTransactionAndCreditWallet(transactionId: string, metadata: MpesaTransactionMetadata) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!current) {
      return;
    }

    const currentMetadata = (current.metadata || {}) as MpesaTransactionMetadata;
    if (currentMetadata.credited || !currentMetadata.walletId) {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "COMPLETED",
          metadata: toJson({
            ...currentMetadata,
            ...metadata,
            credited: currentMetadata.credited || false,
          }),
        },
      });
      return;
    }

    const wallet = await tx.wallet.findFirst({
      where: {
        id: currentMetadata.walletId,
        userId: current.userId,
        currency: current.currency,
      },
    });

    if (!wallet) {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "COMPLETED",
          metadata: toJson({
            ...currentMetadata,
            ...metadata,
            credited: false,
            creditError: "Wallet not found for completed M-Pesa transaction",
          }),
        },
      });
      return;
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: current.amount } },
    });

    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED",
        metadata: toJson({
          ...currentMetadata,
          ...metadata,
          credited: true,
          creditedAt: new Date().toISOString(),
        }),
      },
    });
  });
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { amount, currency = "KES", phoneNumber, description, walletId } = body;

    if (!amount || amount <= 0) {
      const error = createErrorResponse(
        "INVALID_AMOUNT",
        "Amount must be greater than 0",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    if (!mpesaAPI.validatePhoneNumber(phoneNumber)) {
      const error = createErrorResponse(
        "INVALID_PHONE",
        "Please enter a valid M-Pesa phone number (e.g., 0712345678)",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    if (currency !== "KES") {
      const error = createErrorResponse(
        "INVALID_CURRENCY",
        "Safaricom M-Pesa wallet funding currently supports KES only",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    let wallet = null;
    if (walletId) {
      wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId, currency },
      });

      if (!wallet) {
        const error = createErrorResponse(
          "WALLET_NOT_FOUND",
          "Wallet not found for this user and currency",
          undefined,
          404
        );
        return NextResponse.json(error.body, { status: error.status });
      }
    }

    const transactionReference = `MP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const callbackUrl = mpesaAPI.getCallbackUrl();
    const formattedPhone = mpesaAPI.formatPhoneNumber(phoneNumber);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency,
        status: "PENDING",
        type: wallet ? "WALLET_FUNDING" : "PAYMENT",
        reference: transactionReference,
        metadata: toJson({
          provider: "MPESA",
          phoneNumber: formattedPhone,
          walletId: wallet?.id,
          description: description || "WeduPay Wallet Funding",
          credited: false,
        } satisfies MpesaTransactionMetadata),
      },
    });

    const mpesaResponse = await mpesaAPI.initiateSTKPush({
      phoneNumber,
      amount,
      reference: transactionReference,
      description: description || "WeduPay Wallet Funding",
      callbackUrl,
    });

    if (mpesaResponse.responseCode !== "0") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });

      const error = createErrorResponse(
        "PAYMENT_FAILED",
        mpesaResponse.responseDescription || "M-Pesa payment initiation failed",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const nextMetadata: MpesaTransactionMetadata = {
      provider: "MPESA",
      phoneNumber: formattedPhone,
      walletId: wallet?.id,
      description: description || "WeduPay Wallet Funding",
      merchantRequestId: mpesaResponse.merchantRequestId,
      checkoutRequestId: mpesaResponse.checkoutRequestId,
      credited: false,
      providerResponse: mpesaResponse.raw,
    };

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        metadata: toJson(nextMetadata),
      },
    });

    await prisma.webhookEvent.create({
      data: {
        provider: "MPESA",
        eventType: "STK_PUSH_INITIATED",
        payload: JSON.stringify(mpesaResponse),
        status: "RECEIVED",
      },
    });

    const response = {
      data: {
        id: transaction.id,
        type: "payment",
        attributes: {
          amount: transaction.amount,
          currency: transaction.currency,
          status: "PENDING",
          provider: "M-Pesa",
          phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"),
          reference: transaction.reference,
          checkoutRequestId: mpesaResponse.checkoutRequestId,
          merchantRequestId: mpesaResponse.merchantRequestId,
          walletId: wallet?.id,
          createdAt: transaction.createdAt,
        },
        _links: {
          self: { href: `/api/payments/${transaction.id}` },
          status: { href: `/api/mpesa/status/${mpesaResponse.checkoutRequestId}` },
        },
      },
      meta: {
        message: "Payment initiated. Please check your phone and enter your M-Pesa PIN to confirm.",
        instructions: [
          "You will receive an STK push on your M-Pesa phone",
          "Enter your M-Pesa PIN to confirm",
          "The payment will be processed automatically",
        ],
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("M-Pesa payment error:", error);
    const errorResp = createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to process payment",
      undefined,
      500
    );
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        {
          data: {
            type: "provider-info",
            attributes: {
              name: "M-Pesa",
              supportedCurrencies: ["KES"],
              minAmount: 1,
              maxAmount: 150000,
              description: "M-Pesa is a mobile money service by Safaricom Kenya",
              logo: "/providers/mpesa.svg",
            },
          },
        },
        { status: 200 }
      );
    }

    const isValid = mpesaAPI.validatePhoneNumber(phone);

    return NextResponse.json({
      data: {
        type: "phone-validation",
        attributes: {
          phone,
          isValid,
          formatted: isValid ? phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3") : null,
          provider: "M-Pesa",
        },
      },
    });
  } catch (error) {
    console.error("M-Pesa validation error:", error);
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Failed to validate phone number" } },
      { status: 500 }
    );
  }
}
