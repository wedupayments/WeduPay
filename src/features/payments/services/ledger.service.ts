/**
 * LedgerService + RefundService
 *
 * Extracted from src/services/index.ts.
 * Handles double-entry bookkeeping queries and refund orchestration.
 */

import {
  LedgerEntryRepository,
  TransactionRepository,
} from "@/lib/db/repositories";
import { WalletService } from "@/features/wallet/services/wallet.service";
import { PaymentService } from "./payment.service";

// ─── LedgerService ────────────────────────────────────────────────────────────

export class LedgerService {
  private readonly ledgerRepo: LedgerEntryRepository;
  private readonly transactionRepo: TransactionRepository;

  constructor() {
    this.ledgerRepo = new LedgerEntryRepository();
    this.transactionRepo = new TransactionRepository();
  }

  async getTransactionLedger(transactionId: string) {
    return this.ledgerRepo.findByTransactionId(transactionId);
  }

  async verifyDoubleEntry(
    transactionId: string
  ): Promise<{
    isBalanced: boolean;
    totalDebits: number;
    totalCredits: number;
    difference: number;
  }> {
    const entries = await this.ledgerRepo.findByTransactionId(transactionId);

    const debits = entries
      .filter((e) => e.entryType === "DEBIT")
      .reduce((sum, e) => sum + e.amount, 0);

    const credits = entries
      .filter((e) => e.entryType === "CREDIT")
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      isBalanced: Math.abs(debits - credits) < 0.01,
      totalDebits: debits,
      totalCredits: credits,
      difference: debits - credits,
    };
  }

  async getAccountStatement(accountId: string, currency: string) {
    const balance = await this.ledgerRepo.getAccountBalance(
      accountId,
      currency
    );
    return { accountId, currency, balance };
  }
}

// ─── RefundService ────────────────────────────────────────────────────────────

export class RefundService {
  private readonly paymentService: PaymentService;
  private readonly walletService: WalletService;

  constructor() {
    this.paymentService = new PaymentService();
    this.walletService = new WalletService();
  }

  async processRefund(
    transactionId: string,
    _reason: string
  ): Promise<{
    success: boolean;
    refundId: string;
    refundReference: string;
    amount: number;
    currency: string;
  }> {
    const transaction = await this.paymentService.getTransaction(transactionId);
    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status !== "COMPLETED")
      throw new Error("Can only refund completed transactions");

    const refundRef = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const refundTx = await this.paymentService.createTransaction({
      userId: transaction.userId,
      amount: -transaction.amount,
      currency: transaction.currency,
      type: "PAYMENT",
      reference: refundRef,
    });

    const wallet = await this.walletService.getOrCreateWallet(
      transaction.userId,
      "ecocash",
      transaction.currency
    );

    await this.paymentService.recordPaymentToLedger(
      refundTx.id,
      wallet.id,
      transaction.amount,
      transaction.currency
    );

    await this.walletService.updateBalance(wallet.id, transaction.amount);
    await this.paymentService.updateTransactionStatus(refundTx.id, "COMPLETED");

    return {
      success: true,
      refundId: refundTx.id,
      refundReference: refundRef,
      amount: transaction.amount,
      currency: transaction.currency,
    };
  }
}
