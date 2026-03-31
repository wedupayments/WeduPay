import { NextResponse } from "next/server";
import { paymentService, walletService } from "@/services";
import { WalletAdapterFactory, WalletProvider } from "@/services/wallets";
import { createErrorResponse } from "@/lib/api-response";

export interface PaymentRequest {
  walletType: WalletProvider;
  phoneNumber: string;
  amount: number;
  currency?: string;
  description?: string;
}

export class PaymentController {
  async createPayment(request: Request) {
    try {
      const body: PaymentRequest = await request.json();
      const { walletType, phoneNumber, amount, currency = "USD", description } = body;

      if (!walletType || !phoneNumber || !amount) {
        return NextResponse.json(
          createErrorResponse("INVALID_REQUEST", "Missing required fields", undefined, 400).body,
          { status: 400 }
        );
      }

      if (!WalletAdapterFactory.isProviderSupported(walletType)) {
        return NextResponse.json(
          createErrorResponse("UNSUPPORTED_PROVIDER", `Provider ${walletType} is not supported`, undefined, 400).body,
          { status: 400 }
        );
      }

      if (amount <= 0 || amount > 100000) {
        return NextResponse.json(
          createErrorResponse("INVALID_AMOUNT", "Amount must be between 0.01 and 100000", undefined, 400).body,
          { status: 400 }
        );
      }

      const adapter = WalletAdapterFactory.getAdapter(walletType);

      if (!adapter.validatePhoneNumber(phoneNumber)) {
        return NextResponse.json(
          createErrorResponse("INVALID_PHONE", "Please enter a valid phone number", undefined, 400).body,
          { status: 400 }
        );
      }

      const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const formattedPhone = adapter.formatPhoneNumber(phoneNumber);

      const transaction = await paymentService.createTransaction({
        userId: "system",
        amount,
        currency,
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

  async listPayments(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const status = searchParams.get("status") || undefined;

      const { transactions, total } = await paymentService.getUserTransactions("system", {
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

export class WalletController {
  async listWallets(request: Request) {
    try {
      const wallets = await walletService.getUserWallets("system");

      return NextResponse.json({
        data: wallets.map((w) => ({
          id: w.id,
          type: "wallet",
          attributes: {
            walletType: w.walletType,
            currency: w.currency,
            balance: w.balance,
            createdAt: w.createdAt,
          },
        })),
      });
    } catch (error) {
      console.error("List wallets error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", "Failed to list wallets", undefined, 500).body,
        { status: 500 }
      );
    }
  }

  async getWalletBalance(request: Request, params: { id: string }) {
    try {
      const { id } = params;
      const wallet = await walletService.getWallet("system", id);

      if (!wallet) {
        return NextResponse.json(
          createErrorResponse("NOT_FOUND", "Wallet not found", undefined, 404).body,
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: {
          id: wallet.id,
          type: "wallet-balance",
          attributes: {
            walletType: wallet.walletType,
            currency: wallet.currency,
            balance: wallet.balance,
          },
        },
      });
    } catch (error) {
      console.error("Get wallet balance error:", error);
      return NextResponse.json(
        createErrorResponse("INTERNAL_ERROR", "Failed to get wallet balance", undefined, 500).body,
        { status: 500 }
      );
    }
  }
}
