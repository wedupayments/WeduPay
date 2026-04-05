import {
  WalletRepository,
  TransactionRepository,
  LedgerEntryRepository,
  UserRepository,
} from "@/repositories";

export type TransactionStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type TransactionType = "PAYMENT" | "TRANSFER" | "WITHDRAWAL" | "DEPOSIT";

export interface CreateTransactionInput {
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  reference: string;
  description?: string;
}

export interface PaymentInput {
  userId: string;
  walletType: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  description?: string;
}

export interface TransferInput {
  userId: string;
  sourceWalletType: string;
  destinationWalletType: string;
  destinationPhone: string;
  amount: number;
  currency: string;
}

export class PaymentService {
  private walletRepo: WalletRepository;
  private transactionRepo: TransactionRepository;
  private ledgerRepo: LedgerEntryRepository;
  private userRepo: UserRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.transactionRepo = new TransactionRepository();
    this.ledgerRepo = new LedgerEntryRepository();
    this.userRepo = new UserRepository();
  }

  async createTransaction(input: CreateTransactionInput) {
    return this.transactionRepo.create({
      userId: input.userId,
      amount: input.amount,
      currency: input.currency,
      type: input.type,
      reference: input.reference,
      status: "PENDING",
    });
  }

  async updateTransactionStatus(transactionId: string, status: TransactionStatus) {
    return this.transactionRepo.update(transactionId, { status });
  }

  async getTransaction(transactionId: string) {
    return this.transactionRepo.findById(transactionId);
  }

  async getUserTransactions(userId: string, options?: { page?: number; limit?: number; status?: string }) {
    return this.transactionRepo.findByUserId(userId, options);
  }

  async recordPaymentToLedger(transactionId: string, walletId: string, amount: number, currency: string) {
    const PLATFORM_ACCOUNT = "PLATFORM_SETTLEMENT";
    
    await this.ledgerRepo.createDoubleEntry(
      transactionId,
      [{ accountId: walletId, amount, currency }],
      [{ accountId: PLATFORM_ACCOUNT, amount, currency }]
    );

    return true;
  }

  async recordWithdrawalFromLedger(transactionId: string, walletId: string, amount: number, currency: string) {
    const PLATFORM_ACCOUNT = "PLATFORM_SETTLEMENT";
    
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
  ) {
    await this.ledgerRepo.createDoubleEntry(
      transactionId,
      [{ accountId: destWalletId, amount, currency }],
      [{ accountId: sourceWalletId, amount, currency }]
    );

    return true;
  }

  validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 100000;
  }

  validateCurrency(currency: string): boolean {
    const supported = ["USD", "EUR", "KES", "ZAR", "ZWL", "ZiG"];
    return supported.includes(currency.toUpperCase());
  }
}

export class WalletService {
  private walletRepo: WalletRepository;
  private ledgerRepo: LedgerEntryRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.ledgerRepo = new LedgerEntryRepository();
  }

  async getUserWallets(userId: string) {
    return this.walletRepo.findByUserId(userId);
  }

  async getWallet(userId: string, walletType: string) {
    return this.walletRepo.findByUserAndType(userId, walletType);
  }

  async createWallet(userId: string, walletType: string, currency: string, initialBalance = 0) {
    return this.walletRepo.create({
      userId,
      walletType,
      currency,
      balance: initialBalance,
    });
  }

  async updateBalance(walletId: string, amount: number) {
    return this.walletRepo.updateBalance(walletId, amount);
  }

  async updateWallet(walletId: string, userId: string, data: { nickname?: string }) {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found or access denied");
    }
    return this.walletRepo.update(walletId, data);
  }

  async getWalletBalance(walletId: string, currency: string) {
    return this.ledgerRepo.getAccountBalance(walletId, currency);
  }

  async getOrCreateWallet(userId: string, walletType: string, currency: string) {
    let wallet = await this.walletRepo.findByUserAndType(userId, walletType);
    
    if (!wallet) {
      wallet = await this.createWallet(userId, walletType, currency);
    }
    
    return wallet;
  }

  validateWalletType(type: string): boolean {
    const supported = ["ecocash", "mpesa", "mtn", "airtel", "card"];
    return supported.includes(type.toLowerCase());
  }
}

export class TransferService {
  private walletService: WalletService;
  private paymentService: PaymentService;

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

  async executeTransfer(transactionId: string, sourceWalletId: string, destWalletId: string) {
    const transaction = await this.paymentService.getTransaction(transactionId);
    
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "PENDING") {
      throw new Error("Transaction already processed");
    }

    await this.paymentService.recordTransferToLedger(
      transactionId,
      sourceWalletId,
      destWalletId,
      transaction.amount,
      transaction.currency
    );

    await this.walletService.updateBalance(sourceWalletId, -transaction.amount);
    await this.walletService.updateBalance(destWalletId, transaction.amount);

    await this.paymentService.updateTransactionStatus(transactionId, "COMPLETED");

    return { success: true, transactionId };
  }
}

export class LedgerService {
  private ledgerRepo: LedgerEntryRepository;
  private transactionRepo: TransactionRepository;

  constructor() {
    this.ledgerRepo = new LedgerEntryRepository();
    this.transactionRepo = new TransactionRepository();
  }

  async getTransactionLedger(transactionId: string) {
    return this.ledgerRepo.findByTransactionId(transactionId);
  }

  async verifyDoubleEntry(transactionId: string) {
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
    const balance = await this.ledgerRepo.getAccountBalance(accountId, currency);
    
    return {
      accountId,
      currency,
      balance,
    };
  }

  async reconcileAccounts() {
    const accounts = await this.ledgerRepo.findMany({
      select: { accountId: true, currency: true },
      distinct: ["accountId", "currency"],
    });

    const results = await Promise.all(
      accounts.map(async (acc) => ({
        accountId: acc.accountId,
        currency: acc.currency,
        balance: await this.ledgerRepo.getAccountBalance(acc.accountId, acc.currency),
      }))
    );

    return results;
  }
}

export class RefundService {
  private paymentService: PaymentService;
  private walletService: WalletService;
  private ledgerService: LedgerService;

  constructor() {
    this.paymentService = new PaymentService();
    this.walletService = new WalletService();
    this.ledgerService = new LedgerService();
  }

  async processRefund(transactionId: string, reason: string) {
    const transaction = await this.paymentService.getTransaction(transactionId);
    
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "COMPLETED") {
      throw new Error("Can only refund completed transactions");
    }

    const refundRef = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const refundTransaction = await this.paymentService.createTransaction({
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

    if (!wallet) {
      throw new Error("Failed to get or create wallet");
    }

    await this.paymentService.recordPaymentToLedger(
      refundTransaction.id,
      wallet.id,
      transaction.amount,
      transaction.currency
    );

    await this.walletService.updateBalance(wallet.id, transaction.amount);
    await this.paymentService.updateTransactionStatus(refundTransaction.id, "COMPLETED");

    return {
      success: true,
      refundId: refundTransaction.id,
      refundReference: refundRef,
      amount: transaction.amount,
      currency: transaction.currency,
    };
  }
}

export const paymentService = new PaymentService();
export const walletService = new WalletService();
export const transferService = new TransferService();
export const ledgerService = new LedgerService();
export const refundService = new RefundService();
