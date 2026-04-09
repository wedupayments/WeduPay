import { NextResponse } from "next/server";
import { paymentService, walletService } from "@/services";
import { WalletAdapterFactory } from "@/services/wallets";
import { createErrorResponse } from "@/lib/api-response";
import { paymentSchema, paginationSchema, validateRequest } from "@/lib/validation";
import type { WalletProvider } from "@/lib/validation";

export class PaymentController {
  async createPayment(request: Request, userId: string) {
    try {
      const body = await request.json();
      const validation = validateRequest(paymentSchema, body);

      if (!validation.success || !validation.data) {
        return NextResponse.json(
          createErrorResponse("VALIDATION_ERROR", "Invalid request data", validation.errors!, 400).body,
          { status: 400 }
        );
      }

      const { walletType, phoneNumber, amount, currency, description } = validation.data;
      const adapter = WalletAdapterFactory.getAdapter(walletType as WalletProvider);

      if (!adapter.validatePhoneNumber(phoneNumber)) {
        return NextResponse.json(
          createErrorResponse("INVALID_PHONE", "Please enter a valid phone number", undefined, 400).body,
          { status: 400 }
        );
      }

      const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const formattedPhone = adapter.formatPhoneNumber(phoneNumber);
      const currencyValue = currency || "USD";

      const transaction = await paymentService.createTransaction({
        userId,
        amount,
        currency: currencyValue,
        type: "PAYMENT",
        reference,
      });

      const result = await adapter.initiatePayment(
        formattedPhone,
        amount,
        reference,
        description || "WeduPay Wallet Funding"
      );

      if (!result.success && result.status === "FAILED") {
        await paymentService.updateTransactionStatus(transaction.id, "FAILED");
        return NextResponse.json(
          createErrorResponse("PAYMENT_FAILED", result.message || "Payment initiation failed", undefined, 400).body,
          { status: 400 }
        );
      }

      await paymentService.updateTransactionStatus(
        transaction.id,
        result.status === "SUCCESS" ? "COMPLETED" : "PENDING"
      );

      const response = {
        data: {
          id: transaction.id,
          type: "payment",
          attributes: {
            amount,
            currency,
            status: result.status === "SUCCESS" ? "COMPLETED" : "PENDING",
            provider: adapter.getProviderName(),
            phoneNumber: formattedPhone,
            reference,
            providerReference: result.providerReference,
            createdAt: transaction.createdAt,
          },
          _links: {
            self: { href: `/api/v1/payments/${transaction.id}` },
            status: { href: `/api/v1/payments/${transaction.id}/status` },
          },
        },
        meta: {
          message: result.message || (result.status === "SUCCESS" 
            ? "Payment completed successfully" 
            : "Payment initiated. Please check your phone to confirm."),
          instructions: result.status === "PENDING" ? [
            "Check your phone for the payment prompt",
            "Enter your PIN to confirm",
            "Wait for confirmation",
          ] : undefined,
        },
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      console.error("Payment controller error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", "Failed to process payment", undefined, 500).body,
        { status: 500 }
      );
    }
  }

  async getPayment(request: Request, params: { id: string }) {
    try {
      const { id } = params;
      const transaction = await paymentService.getTransaction(id);

      if (!transaction) {
        return NextResponse.json(
          createErrorResponse("NOT_FOUND", "Transaction not found", undefined, 404).body,
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: {
          id: transaction.id,
          type: "payment",
          attributes: {
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            type: transaction.type,
            reference: transaction.reference,
            createdAt: transaction.createdAt,
          },
          _links: {
            self: { href: `/api/v1/payments/${transaction.id}` },
          },
        },
      });
    } catch (error) {
      console.error("Get payment error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", "Failed to get payment", undefined, 500).body,
        { status: 500 }
      );
    }
  }

  async listPayments(request: Request, userId: string) {
    try {
      const { searchParams } = new URL(request.url);
      const pagination = {
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "20",
        sortBy: searchParams.get("sortBy") || "createdAt",
        sortOrder: searchParams.get("sortOrder") || "desc",
        status: searchParams.get("status") || undefined,
      };

      const validation = validateRequest(paginationSchema, pagination);

      if (!validation.success || !validation.data) {
        return NextResponse.json(
          createErrorResponse("VALIDATION_ERROR", "Invalid query parameters", validation.errors!, 400).body,
          { status: 400 }
        );
      }

      const { page = 1, limit = 20, status } = validation.data;

      const { transactions, total } = await paymentService.getUserTransactions(userId, {
        page,
        limit,
        status,
      });

      return NextResponse.json({
        data: transactions.map((t) => ({
          id: t.id,
          type: "payment",
          attributes: {
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            type: t.type,
            reference: t.reference,
            createdAt: t.createdAt,
          },
        })),
        _meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("List payments error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", "Failed to list payments", undefined, 500).body,
        { status: 500 }
      );
    }
  }
}

export const paymentController = new PaymentController();

// WalletController has been promoted to its own file.
// Re-export for backward compatibility with any existing imports.
export { WalletController, walletController } from "./wallet.controller";
