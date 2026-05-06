import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mpesaAPI } from "@/lib/mpesa";
import { createErrorResponse } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

type MpesaTransactionMetadata = {
  provider?: string;
  phoneNumber?: string;
  walletId?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  transactionReceipt?: string;
  credited?: boolean;
  providerResponse?: unknown;
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

async function completeTransactionAndCreditWallet(transactionId: string, lookupMetadata: MpesaTransactionMetadata) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!current) {
      return;
    }

    const currentMetadata = (current.metadata || {}) as MpesaTransactionMetadata;
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
  { params }: { params: Promise<{ checkoutRequestId: string }> }
) {
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

    const { checkoutRequestId } = await params;
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: auth.userId!,
        OR: [
          { metadata: { path: ["checkoutRequestId"], equals: checkoutRequestId } },
          { reference: checkoutRequestId },
        ],
      },
    });

    if (!transaction) {
      const error = createErrorResponse("NOT_FOUND", "Transaction not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    if (transaction.status !== "PENDING") {
      const metadata = (transaction.metadata || {}) as MpesaTransactionMetadata;
      return NextResponse.json({
        data: {
          id: transaction.id,
          type: "transaction-status",
          attributes: {
            checkoutRequestId,
            status: transaction.status,
            responseCode: transaction.status === "COMPLETED" ? "0" : "999999",
            responseDescription: transaction.status,
            transactionReceipt: metadata.transactionReceipt,
            transactionAmount: transaction.amount,
            walletCredited: metadata.credited === true,
          },
          _links: {
            self: { href: `/api/mpesa/status/${checkoutRequestId}` },
          },
        },
      }, { status: 200 });
    }

    const status = await mpesaAPI.querySTKStatus(checkoutRequestId);

    const statusMap: Record<string, string> = {
      "0": "COMPLETED",
      "17": "CANCELLED",
    };
    const normalizedStatus = statusMap[status.responseCode] || (status.responseCode === "999999" ? "FAILED" : "PENDING");

    const metadata = (transaction.metadata || {}) as MpesaTransactionMetadata;

    if (normalizedStatus !== "PENDING") {
      if (normalizedStatus === "COMPLETED") {
        await completeTransactionAndCreditWallet(transaction.id, {
          transactionReceipt: status.transactionReceipt,
          checkoutRequestId,
          providerResponse: status.raw,
        });
      } else {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: normalizedStatus,
            metadata: toJson({
              ...metadata,
              transactionReceipt: status.transactionReceipt,
              providerResponse: status.raw,
            }),
          },
        });
      }
    }

    const refreshed = await prisma.transaction.findUnique({
      where: { id: transaction.id },
    });
    const refreshedMetadata = (refreshed?.metadata || metadata) as MpesaTransactionMetadata;

    return NextResponse.json({
      data: {
        id: transaction.id,
        type: "transaction-status",
        attributes: {
          checkoutRequestId,
          status: refreshed?.status || normalizedStatus,
          responseCode: status.responseCode,
          responseDescription: status.responseDescription,
          transactionReceipt: status.transactionReceipt,
          transactionDate: status.transactionDate,
          transactionAmount: status.transactionAmount,
          walletCredited: refreshedMetadata.credited === true,
        },
        _links: {
          self: { href: `/api/mpesa/status/${checkoutRequestId}` },
        },
      },
    }, { status: 200 });
  } catch (error) {
    console.error("M-Pesa status check error:", error);
    const errorResp = createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to check transaction status",
      undefined,
      500
    );
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
