/**
 * PaymentService
 *
 * Handles payment lifecycle: create, update, ledger recording.
 * Extracted from src/services/index.ts.
 */

import {
  WalletRepository,
  TransactionRepository,
  LedgerEntryRepository,
  UserRepository,
} from "@/lib/db/repositories";
import type { Transaction } from "@prisma/client";

export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";
export type TransactionType =
  | "PAYMENT"
  | "TRANSFER"
  | "WITHDRAWAL"
  | "DEPOSIT";

export interface CreateTransactionInput {
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  reference: string;
  description?: string;
  tenantId?: string | null;
}

const SUPPORTED_CURRENCIES = ["USD", "EUR", "KES", "ZAR", "ZWL", "ZiG"];
const PLATFORM_ACCOUNT = "PLATFORM_SETTLEMENT";

export class PaymentService {
  private readonly walletRepo: WalletRepository;
  private readonly transactionRepo: TransactionRepository;
  private readonly ledgerRepo: LedgerEntryRepository;
  private readonly userRepo: UserRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.transactionRepo = new TransactionRepository();
    this.ledgerRepo = new LedgerEntryRepository();
    this.userRepo = new UserRepository();
  }

  async createTransaction(
    input: CreateTransactionInput
  ): Promise<Transaction> {
    return this.transactionRepo.createTransaction({
      userId: input.userId,
      amount: input.amount,
      currency: input.currency,
      type: input.type,
      reference: input.reference,
      status: "PENDING",
      tenantId: input.tenantId ?? null,
    });
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus
  ): Promise<Transaction> {
    return this.transactionRepo.update(transactionId, { status });
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    return this.transactionRepo.findById(transactionId);
  }

  async getUserTransactions(
    userId: string,
    options?: { page?: number; limit?: number; status?: string }
  ) {
    return this.transactionRepo.findByUserId(userId, options);
  }

  async recordPaymentToLedger(
    transactionId: string,
    walletId: string,
    amount: number,
    currency: string
  ): Promise<true> {
    await this.ledgerRepo.createDoubleEntry(
      transactionId,
      [{ accountId: walletId, amount, currency }],
      [{ accountId: PLATFORM_ACCOUNT, amount, currency }]
    );
    return true;
  }

  async recordWithdrawalFromLedger(
    transactionId: string,
    walletId: string,
    amount: number,
    currency: string
  ): Promise<true> {
    await this.ledgerRepo.createDoubleEntry(
      transactionId,
      [{ accountId: PLATFORM_ACCOUNT, amount, currency }],
      [{ accountId: walletId, amount, currency }]
    );
    return true;
  }

  async recordTransferToLedger(
    transactionId: string,
    sourceWalletId: string,
    destWalletId: string,
    amount: number,
    currency: string
  ): Promise<true> {
    await this.ledgerRepo.createDoubleEntry(
      transactionId,
      [{ accountId: destWalletId, amount, currency }],
      [{ accountId: sourceWalletId, amount, currency }]
    );
    return true;
  }

  validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 100_000;
  }

  validateCurrency(currency: string): boolean {
    return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
  }
}
