/**
 * TransferService
 *
 * Orchestrates wallet-to-wallet transfers including ledger double-entry.
 * Extracted from src/services/index.ts.
 */

import { WalletService } from "@/features/wallet/services/wallet.service";
import { PaymentService } from "@/features/payments/services/payment.service";

export interface TransferInput {
  userId: string;
  sourceWalletType: string;
  destinationWalletType: string;
  destinationPhone: string;
  amount: number;
  currency: string;
}

export class TransferService {
  private readonly walletService: WalletService;
  private readonly paymentService: PaymentService;

  constructor() {
    this.walletService = new WalletService();
    this.paymentService = new PaymentService();
  }

  async initiateTransfer(input: TransferInput) {
    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const transaction = await this.paymentService.createTransaction({
      userId: input.userId,
      amount: input.amount,
      currency: input.currency,
      type: "TRANSFER",
      reference,
    });

    return {
      transaction,
      status: "PENDING",
      message: "Transfer initiated. Awaiting confirmation.",
    };
  }

  async executeTransfer(
    transactionId: string,
    sourceWalletId: string,
    destWalletId: string
  ): Promise<{ success: boolean; transactionId: string }> {
    const transaction = await this.paymentService.getTransaction(transactionId);
    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status !== "PENDING")
      throw new Error("Transaction already processed");

    await this.paymentService.recordTransferToLedger(
      transactionId,
      sourceWalletId,
      destWalletId,
      transaction.amount,
      transaction.currency
    );

    await Promise.all([
      this.walletService.updateBalance(sourceWalletId, -transaction.amount),
      this.walletService.updateBalance(destWalletId, transaction.amount),
    ]);

    await this.paymentService.updateTransactionStatus(
      transactionId,
      "COMPLETED"
    );

    return { success: true, transactionId };
  }
}
