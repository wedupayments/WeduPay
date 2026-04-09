import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiResponse, createErrorResponse } from "@/lib/api-response";

export class TransferController {
  async list(request: Request, userId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const perPage = parseInt(searchParams.get("perPage") || "20");

      const where = {
        userId,
        type: { in: ["TRANSFER", "TRANSFER_RECEIVED"] },
      };

      const [transfers, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: perPage,
          skip: (page - 1) * perPage,
        }),
        prisma.transaction.count({ where }),
      ]);

      const response = createApiResponse(transfers, request, { page, perPage, total });
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("[TransferController] list error:", error);
      const err = createErrorResponse("INTERNAL_ERROR", "Failed to fetch transfers", undefined, 500);
      return NextResponse.json(err.body, { status: err.status });
    }
  }

  async create(request: Request, userId: string) {
    try {
      const body = await request.json();
      const { toUserId, amount, currency, walletType, description } = body;

      const errors: Array<{ code: string; target: string; message: string }> = [];
      if (!toUserId) errors.push({ code: "REQUIRED", target: "toUserId", message: "Recipient user ID is required" });
      if (!amount) errors.push({ code: "REQUIRED", target: "amount", message: "Amount is required" });
      if (!currency) errors.push({ code: "REQUIRED", target: "currency", message: "Currency is required" });
      if (!walletType) errors.push({ code: "REQUIRED", target: "walletType", message: "Wallet type is required" });

      if (errors.length > 0) {
        const err = createErrorResponse("VALIDATION_ERROR", "Invalid request data", errors, 400);
        return NextResponse.json(err.body, { status: err.status });
      }

      if (amount <= 0) {
        const err = createErrorResponse("INVALID_AMOUNT", "Amount must be greater than 0", undefined, 400);
        return NextResponse.json(err.body, { status: err.status });
      }

      if (userId === toUserId) {
        const err = createErrorResponse("SELF_TRANSFER", "Cannot transfer to yourself", undefined, 400);
        return NextResponse.json(err.body, { status: err.status });
      }

      const [senderWallet, recipientWallet] = await Promise.all([
        prisma.wallet.findFirst({ where: { userId, walletType, currency } }),
        prisma.wallet.findFirst({ where: { userId: toUserId, walletType, currency } }),
      ]);

      if (!senderWallet) {
        const err = createErrorResponse("WALLET_NOT_FOUND", "Sender wallet not found", undefined, 404);
        return NextResponse.json(err.body, { status: err.status });
      }

      if (senderWallet.balance < amount) {
        const err = createErrorResponse("INSUFFICIENT_BALANCE", "Insufficient balance", undefined, 400);
        return NextResponse.json(err.body, { status: err.status });
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
          data: { userId, amount, currency, status: "COMPLETED", type: "TRANSFER", reference },
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

        return { debitTransaction, creditTransaction };
      });

      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}/api/v1/transfers`;

      return NextResponse.json({
        data: {
          id: result.debitTransaction.id,
          type: "transfer",
          attributes: {
            amount,
            currency,
            status: "COMPLETED",
            reference,
            description,
            recipientUserId: toUserId,
            createdAt: result.debitTransaction.createdAt,
          },
          relationships: {
            debitTransaction: { id: result.debitTransaction.id, type: "transaction" },
            creditTransaction: { id: result.creditTransaction.id, type: "transaction" },
          },
        },
        links: {
          self: `${baseUrl}/${result.debitTransaction.id}`,
          collection: baseUrl,
        },
      }, { status: 201 });
    } catch (error) {
      console.error("[TransferController] create error:", error);
      const err = createErrorResponse("INTERNAL_ERROR", "Failed to process transfer", undefined, 500);
      return NextResponse.json(err.body, { status: err.status });
    }
  }
}

export const transferController = new TransferController();
