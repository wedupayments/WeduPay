import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ecocashAPI } from "@/lib/ecocash";
import { createErrorResponse } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

type EcoCashTransactionMetadata = {
  provider: "ECOCASH";
  phoneNumber: string;
  sourceReference?: string;
  ecocashReference?: string;
  transactionId?: string;
  walletId?: string;
  description?: string;
  credited?: boolean;
  providerResponse?: unknown;
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

async function completeTransactionAndCreditWallet(transactionId: string, metadata: EcoCashTransactionMetadata) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!current) {
      return;
    }

    const currentMetadata = (current.metadata || {}) as EcoCashTransactionMetadata;
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
            creditError: "Wallet not found for completed EcoCash transaction",
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
    const { amount, currency = "USD", phoneNumber, description, walletId } = body;

    if (!amount || amount <= 0) {
      const error = createErrorResponse("INVALID_AMOUNT", "Amount must be greater than 0", undefined, 400);
      return NextResponse.json(error.body, { status: error.status });
    }

    if (!ecocashAPI.validatePhoneNumber(phoneNumber)) {
      const error = createErrorResponse(
        "INVALID_PHONE",
        "Please enter a valid EcoCash phone number (e.g., 0771234567)",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    if (!["USD", "ZWL", "ZiG"].includes(currency)) {
      const error = createErrorResponse("INVALID_CURRENCY", "EcoCash supports USD, ZWL, and ZiG", undefined, 400);
      return NextResponse.json(error.body, { status: error.status });
    }

    let wallet = null;
    if (walletId) {
      wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId, currency },
      });

      if (!wallet) {
        const error = createErrorResponse("WALLET_NOT_FOUND", "Wallet not found for this user and currency", undefined, 404);
        return NextResponse.json(error.body, { status: error.status });
      }
    }

    const transactionReference = `EC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const formattedPhone = ecocashAPI.formatPhoneNumber(phoneNumber);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency,
        status: "PENDING",
        type: wallet ? "WALLET_FUNDING" : "PAYMENT",
        reference: transactionReference,
        metadata: toJson({
          provider: "ECOCASH",
          phoneNumber: formattedPhone,
          walletId: wallet?.id,
          description: description || "WeduPay Wallet Funding",
          credited: false,
        } satisfies EcoCashTransactionMetadata),
      },
    });

    const ecocashResponse = await ecocashAPI.initPayment(
      phoneNumber,
      amount,
      description || "WeduPay Wallet Funding",
      transactionReference,
      currency
    );

    if (ecocashResponse.status === "FAILED") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });

      const error = createErrorResponse(
        "PAYMENT_FAILED",
        ecocashResponse.message || "EcoCash payment initiation failed",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const nextMetadata: EcoCashTransactionMetadata = {
      provider: "ECOCASH",
      phoneNumber: formattedPhone,
      walletId: wallet?.id,
      description: description || "WeduPay Wallet Funding",
      sourceReference: ecocashResponse.sourceReference,
      ecocashReference: ecocashResponse.ecocashReference,
      transactionId: ecocashResponse.transactionId,
      credited: false,
      providerResponse: ecocashResponse.raw,
    };

    if (ecocashResponse.status === "SUCCESS") {
      await completeTransactionAndCreditWallet(transaction.id, nextMetadata);
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { metadata: toJson(nextMetadata) },
      });
    }

    await prisma.webhookEvent.create({
      data: {
        provider: "ECOCASH",
        eventType: "PUSH_PAYMENT_INITIATED",
        payload: JSON.stringify(ecocashResponse),
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
          status: ecocashResponse.status === "SUCCESS" ? "COMPLETED" : "PENDING",
          provider: "EcoCash",
          phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"),
          reference: transaction.reference,
          sourceReference: ecocashResponse.sourceReference,
          walletId: wallet?.id,
          createdAt: transaction.createdAt,
        },
        _links: {
          self: { href: `/api/payments/${transaction.id}` },
          status: { href: `/api/ecocash/status/${transactionReference}` },
        },
      },
      meta: {
        message: ecocashResponse.status === "SUCCESS" 
          ? "Payment completed successfully." 
          : "Payment initiated. Please check your phone and enter your PIN to confirm.",
        instructions: ecocashResponse.status === "PENDING_VALIDATION" ? [
          "Check your EcoCash phone for a payment prompt",
          "Enter your EcoCash PIN to confirm",
          "The payment will be processed automatically",
        ] : undefined,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("EcoCash payment error:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to process payment", undefined, 500);
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
              name: "EcoCash",
              supportedCurrencies: ["USD", "ZWL", "ZiG"],
              minAmount: 0.01,
              maxAmount: 10000,
              description: "EcoCash is a mobile money service by Econet Wireless Zimbabwe",
              logo: "/providers/ecocash.svg",
            },
          },
        },
        { status: 200 }
      );
    }

    const isValid = ecocashAPI.validatePhoneNumber(phone);

    return NextResponse.json({
      data: {
        type: "phone-validation",
        attributes: {
          phone,
          isValid,
          formatted: isValid ? phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3") : null,
          provider: "EcoCash",
        },
      },
    });
  } catch (error) {
    console.error("EcoCash validation error:", error);
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Failed to validate phone number" } },
      { status: 500 }
    );
  }
}
