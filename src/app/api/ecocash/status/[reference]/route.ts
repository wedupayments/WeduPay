import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ecocashAPI } from "@/lib/ecocash";
import { createErrorResponse } from "@/lib/api-response";

type EcoCashTransactionMetadata = {
  provider?: string;
  phoneNumber?: string;
  sourceReference?: string;
  ecocashReference?: string;
  walletId?: string;
  credited?: boolean;
  providerResponse?: unknown;
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

async function completeTransactionAndCreditWallet(
  transactionId: string,
  lookupMetadata: EcoCashTransactionMetadata
) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!current) {
      return;
    }

    const currentMetadata = (current.metadata || {}) as EcoCashTransactionMetadata;
    const nextMetadata = {
      ...currentMetadata,
      ...lookupMetadata,
    };

    if (current.status === "COMPLETED" || currentMetadata.credited || !currentMetadata.walletId) {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "COMPLETED",
          metadata: toJson(nextMetadata),
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
            ...nextMetadata,
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
          ...nextMetadata,
          credited: true,
          creditedAt: new Date().toISOString(),
        }),
      },
    });
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: { reference },
    });

    if (!transaction) {
      const error = createErrorResponse(
        "NOT_FOUND",
        "Transaction not found",
        undefined,
        404
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json({
        data: {
          id: transaction.id,
          type: "transaction-status",
          attributes: {
            reference: transaction.reference,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
          },
          _links: {
            self: { href: `/api/ecocash/status/${reference}` },
          },
        },
      }, { status: 200 });
    }

    const metadata = (transaction.metadata || {}) as EcoCashTransactionMetadata;
    const providerReference = metadata.sourceReference || reference;
    const lookupResult = await ecocashAPI.lookupTransaction(metadata.phoneNumber || "", providerReference);

    let newStatus = transaction.status;
    if (lookupResult.paymentSuccess) {
      newStatus = "COMPLETED";
    } else if (lookupResult.status === "FAILED") {
      newStatus = "FAILED";
    }

    if (newStatus !== transaction.status) {
      if (newStatus === "COMPLETED") {
        await completeTransactionAndCreditWallet(transaction.id, {
          provider: "ECOCASH",
          ecocashReference: lookupResult.ecocashReference,
          sourceReference: lookupResult.reference || providerReference,
          providerResponse: lookupResult.raw,
        });
      } else {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: newStatus,
            metadata: toJson({
              ...metadata,
              providerResponse: lookupResult.raw,
              ecocashReference: lookupResult.ecocashReference,
            }),
          },
        });
      }
    }

    const refreshed = await prisma.transaction.findUnique({
      where: { id: transaction.id },
    });
    const refreshedMetadata = (refreshed?.metadata || metadata) as EcoCashTransactionMetadata;

    return NextResponse.json({
      data: {
        id: transaction.id,
        type: "transaction-status",
        attributes: {
          reference: transaction.reference,
          status: refreshed?.status || newStatus,
          amount: transaction.amount,
          currency: transaction.currency,
          providerStatus: lookupResult.status,
          ecocashReference: lookupResult.ecocashReference,
          transactionDateTime: lookupResult.transactionDateTime,
          walletCredited: refreshedMetadata.credited === true,
        },
        _links: {
          self: { href: `/api/ecocash/status/${reference}` },
        },
      },
    }, { status: 200 });
  } catch (error) {
    console.error("EcoCash status check error:", error);
    const errorResp = createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to check transaction status",
      undefined,
      500
    );
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
