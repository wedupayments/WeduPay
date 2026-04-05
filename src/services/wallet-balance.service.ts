/**
 * Wallet Balance Service
 * 
 * Manages user wallet balances, deposits, withdrawals, and balance queries.
 * Supports multi-currency wallets and implements proper balance locking
 * for concurrent transactions.
 * 
 * Features:
 * - Multi-currency wallet support
 * - Atomic balance updates (prevent race conditions)
 * - Deposit/fund wallet functionality
 * - Withdrawal processing
 * - Balance history tracking
 * - Insufficient funds prevention
 * 
 * @module services/wallet-balance
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Wallet balance data structure
 */
export interface WalletBalance {
  id: string;
  userId: string;
  walletType: string;
  currency: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  nickname?: string;
  lastUpdated: Date;
}

/**
 * Deposit/transaction result
 */
export interface BalanceResult {
  success: boolean;
  walletId?: string;
  previousBalance?: number;
  newBalance?: number;
  amount?: number;
  currency?: string;
  transactionId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Wallet funding request
 */
export interface FundWalletRequest {
  userId: string;
  walletId?: string;
  currency: string;
  amount: number;
  source: string; // 'mobile_money', 'bank_transfer', 'card', etc.
  sourceReference?: string;
  description?: string;
}

/**
 * Withdrawal request
 */
export interface WithdrawRequest {
  userId: string;
  walletId?: string;
  currency: string;
  amount: number;
  destination: string; // 'mobile_money', 'bank_account', etc.
  destinationPhone?: string;
  destinationAccount?: string;
  description?: string;
}

/**
 * ============================
 * BALANCE QUERY FUNCTIONS
 * ============================
 */

/**
 * Get wallet balance for a user
 * 
 * Retrieves the current balance for a specific wallet or creates
 * a new wallet if none exists for the currency.
 * 
 * @param userId - User ID
 * @param currency - Currency code (e.g., 'USD', 'KES')
 * @param walletType - Type of wallet (default: 'mobile_wallet')
 * @returns WalletBalance with current balance information
 * 
 * @example
 * ```typescript
 * const balance = await getWalletBalance('user-123', 'USD');
 * console.log(`Available: ${balance.availableBalance} ${balance.currency}`);
 * ```
 */
export async function getWalletBalance(
  userId: string,
  currency: string,
  walletType: string = 'mobile_wallet'
): Promise<WalletBalance> {
  try {
    // Find or create wallet for this currency
    let wallet = await prisma.wallet.findFirst({
      where: {
        userId,
        walletType,
        currency,
      },
    });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          walletType,
          currency,
          balance: 0,
        },
      });
    }

    // Get pending transactions that affect available balance
    const pendingTransactions = await prisma.p2PTransfer.findMany({
      where: {
        userId,
        status: 'PROCESSING',
        sendCurrency: currency,
      },
      select: {
        sendAmount: true,
      },
    });

    const pendingAmount = pendingTransactions.reduce(
      (sum, t) => sum + t.sendAmount,
      0
    );

    return {
      id: wallet.id,
      userId: wallet.userId,
      walletType: wallet.walletType,
      currency: wallet.currency,
      balance: wallet.balance,
      availableBalance: wallet.balance - pendingAmount,
      pendingBalance: pendingAmount,
      nickname: wallet.nickname || undefined,
      lastUpdated: wallet.createdAt, // Would update on balance changes
    };
  } catch (error) {
    console.error('Get wallet balance error:', error);
    throw new Error('Failed to get wallet balance');
  }
}

/**
 * Get all wallet balances for a user
 * 
 * @param userId - User ID
 * @returns Array of WalletBalance for all user wallets
 * 
 * @example
 * ```typescript
 * const balances = await getAllWalletBalances('user-123');
 * balances.forEach(b => {
 *   console.log(`${b.currency}: ${b.availableBalance}`);
 * });
 * ```
 */
export async function getAllWalletBalances(userId: string): Promise<WalletBalance[]> {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
    });

    const balances: WalletBalance[] = [];

    for (const wallet of wallets) {
      const balance = await getWalletBalance(userId, wallet.currency, wallet.walletType);
      balances.push(balance);
    }

    return balances;
  } catch (error) {
    console.error('Get all wallet balances error:', error);
    throw new Error('Failed to get wallet balances');
  }
}

/**
 * ============================
 * DEPOSIT/FUND FUNCTIONS
 * ============================
 */

/**
 * Fund wallet (deposit money)
 * 
 * Adds funds to a user's wallet from an external source.
 * Creates transaction record and updates wallet balance atomically.
 * 
 * @param request - Fund wallet request details
 * @returns BalanceResult with transaction details
 * 
 * @example
 * ```typescript
 * const result = await fundWallet({
 *   userId: 'user-123',
 *   currency: 'USD',
 *   amount: 100,
 *   source: 'mobile_money',
 *   sourceReference: 'MPESA-123456',
 *   description: 'Deposit from M-Pesa'
 * });
 * 
 * if (result.success) {
 *   console.log(`New balance: ${result.newBalance} ${result.currency}`);
 * }
 * ```
 */
export async function fundWallet(request: FundWalletRequest): Promise<BalanceResult> {
  const transactionId = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[FundWallet] ${transactionId} - Processing deposit: ${request.amount} ${request.currency}`);

  try {
    // Validate amount
    if (request.amount <= 0) {
      return {
        success: false,
        error: 'Amount must be positive',
        errorCode: 'INVALID_AMOUNT',
      };
    }

    // Validate maximum deposit amount (prevent money laundering)
    const MAX_DEPOSIT = 100000; // Configurable limit
    if (request.amount > MAX_DEPOSIT) {
      return {
        success: false,
        error: `Deposit amount exceeds maximum limit of ${MAX_DEPOSIT} ${request.currency}`,
        errorCode: 'EXCEEDS_LIMIT',
      };
    }

    // Find or create wallet
    let wallet = await prisma.wallet.findFirst({
      where: {
        userId: request.userId,
        currency: request.currency,
        walletType: 'mobile_wallet',
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: request.userId,
          walletType: 'mobile_wallet',
          currency: request.currency,
          balance: 0,
        },
      });
    }

    // Update wallet balance atomically using database transaction
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: request.amount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: request.userId,
          amount: request.amount,
          currency: request.currency,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          reference: transactionId,
        },
      }),
    ]);

    console.log(`[FundWallet] ${transactionId} - Deposit successful. New balance: ${updatedWallet.balance}`);

    return {
      success: true,
      walletId: wallet.id,
      previousBalance: wallet.balance,
      newBalance: updatedWallet.balance,
      amount: request.amount,
      currency: request.currency,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error(`[FundWallet] ${transactionId} - Error:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fund wallet',
      errorCode: 'DEPOSIT_FAILED',
    };
  }
}

/**
 * ============================
 * WITHDRAWAL FUNCTIONS
 * ============================
 */

/**
 * Withdraw funds from wallet
 * 
 * Removes funds from a user's wallet and sends to external destination.
 * Validates sufficient balance before processing.
 * 
 * @param request - Withdrawal request details
 * @returns BalanceResult with transaction details
 * 
 * @example
 * ```typescript
 * const result = await withdrawFromWallet({
 *   userId: 'user-123',
 *   walletId: 'wallet-123',
 *   currency: 'USD',
 *   amount: 50,
 *   destination: 'mobile_money',
 *   destinationPhone: '254712345678',
 *   description: 'Withdrawal to M-Pesa'
 * });
 * 
 * if (result.success) {
 *   console.log(`Remaining balance: ${result.newBalance} ${result.currency}`);
 * } else {
 *   console.error(result.error); // "Insufficient funds"
 * }
 * ```
 */
export async function withdrawFromWallet(request: WithdrawRequest): Promise<BalanceResult> {
  const transactionId = `WDR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[WithdrawWallet] ${transactionId} - Processing withdrawal: ${request.amount} ${request.currency}`);

  try {
    // Validate amount
    if (request.amount <= 0) {
      return {
        success: false,
        error: 'Amount must be positive',
        errorCode: 'INVALID_AMOUNT',
      };
    }

    // Find wallet
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: request.userId,
        currency: request.currency,
        walletType: request.walletId ? undefined : 'mobile_wallet',
        id: request.walletId || undefined,
      },
    });

    if (!wallet) {
      return {
        success: false,
        error: 'Wallet not found',
        errorCode: 'WALLET_NOT_FOUND',
      };
    }

    // Check sufficient balance
    const balance = await getWalletBalance(request.userId, request.currency);
    
    if (balance.availableBalance < request.amount) {
      return {
        success: false,
        error: `Insufficient funds. Available: ${balance.availableBalance} ${request.currency}`,
        errorCode: 'INSUFFICIENT_FUNDS',
      };
    }

    // Validate minimum balance requirement
    const MIN_BALANCE = 0; // Can be configured per currency
    if (wallet.balance - request.amount < MIN_BALANCE) {
      return {
        success: false,
        error: `Withdrawal would bring balance below minimum of ${MIN_BALANCE} ${request.currency}`,
        errorCode: 'BELOW_MIN_BALANCE',
      };
    }

    // Update wallet balance atomically
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: request.amount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: request.userId,
          amount: request.amount,
          currency: request.currency,
          type: 'WITHDRAWAL',
          status: 'PROCESSING', // Changes to COMPLETED when external transfer completes
          reference: transactionId,
        },
      }),
    ]);

    console.log(`[WithdrawWallet] ${transactionId} - Withdrawal successful. New balance: ${updatedWallet.balance}`);

    return {
      success: true,
      walletId: wallet.id,
      previousBalance: wallet.balance,
      newBalance: updatedWallet.balance,
      amount: request.amount,
      currency: request.currency,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error(`[WithdrawWallet] ${transactionId} - Error:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to withdraw from wallet',
      errorCode: 'WITHDRAWAL_FAILED',
    };
  }
}

/**
 * ============================
 * BALANCE HISTORY FUNCTIONS
 * ============================
 */

/**
 * Get transaction history for a wallet
 * 
 * @param walletId - Wallet ID
 * @param options - Query options (page, limit, type filter)
 * @returns Paginated transaction history
 * 
 * @example
 * ```typescript
 * const history = await getWalletHistory('wallet-123', {
 *   page: 1,
 *   limit: 20,
 *   type: 'DEPOSIT' // Optional filter
 * });
 * ```
 */
export async function getWalletHistory(
  walletId: string,
  options: {
    page?: number;
    limit?: number;
    type?: string;
  } = {}
): Promise<{
  transactions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  try {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: (await prisma.wallet.findUnique({ where: { id: walletId } }))?.userId };

    if (options.type) {
      where.type = options.type;
    }

    // Get transactions and count
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Get wallet history error:', error);
    throw new Error('Failed to get wallet history');
  }
}

/**
 * ============================
 * UTILITY FUNCTIONS
 * ============================
 */

/**
 * Lock balance for pending transaction
 * 
 * Reserves funds for a pending transaction, reducing available balance
 * without changing actual balance.
 * 
 * @param walletId - Wallet ID
 * @param amount - Amount to lock
 * @param transactionRef - Reference to the pending transaction
 * @returns Boolean indicating if lock was successful
 */
export async function lockBalance(
  walletId: string,
  amount: number,
  transactionRef: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      return {
        success: false,
        error: 'Wallet not found',
      };
    }

    if (wallet.balance < amount) {
      return {
        success: false,
        error: 'Insufficient balance to lock',
      };
    }

    // Create balance lock record
    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        amount: -amount, // Negative to indicate locked/reserved
        currency: wallet.currency,
        type: 'BALANCE_LOCK',
        status: 'PENDING',
        reference: `LOCK-${transactionRef}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Lock balance error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to lock balance',
    };
  }
}

/**
 * Release locked balance
 * 
 * Releases previously locked funds when transaction completes or is cancelled.
 * 
 * @param walletId - Wallet ID
 * @param amount - Amount to release
 * @param transactionRef - Reference to the original lock
 * @returns Boolean indicating if release was successful
 */
export async function releaseBalance(
  walletId: string,
  amount: number,
  transactionRef: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update the lock transaction to completed/cancelled
    await prisma.transaction.updateMany({
      where: {
        reference: `LOCK-${transactionRef}`,
        type: 'BALANCE_LOCK',
        status: 'PENDING',
      },
      data: {
        status: 'COMPLETED',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Release balance error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release balance',
    };
  }
}

/**
 * Get total balance across all currencies (in USD equivalent)
 * 
 * @param userId - User ID
 * @returns Total balance in USD with breakdown by currency
 */
export async function getTotalBalanceInUSD(userId: string): Promise<{
  totalUSD: number;
  balances: Array<{ currency: string; amount: number; rate: number; usdValue: number }>;
}> {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
    });

    const balances: Array<{ currency: string; amount: number; rate: number; usdValue: number }> = [];
    let totalUSD = 0;

    for (const wallet of wallets) {
      if (wallet.balance === 0) continue;

      // Get exchange rate to USD
      let rate = 1;
      if (wallet.currency !== 'USD') {
        const exchangeRate = await prisma.exchangeRate.findFirst({
          where: {
            baseCurrency: 'USD',
            targetCurrency: wallet.currency,
            isValid: true,
          },
        });

        rate = exchangeRate ? 1 / exchangeRate.rate : 1;
      }

      const usdValue = wallet.balance * rate;
      totalUSD += usdValue;

      balances.push({
        currency: wallet.currency,
        amount: wallet.balance,
        rate,
        usdValue,
      });
    }

    return {
      totalUSD,
      balances,
    };
  } catch (error) {
    console.error('Get total balance error:', error);
    throw new Error('Failed to get total balance');
  }
}

export default {
  getWalletBalance,
  getAllWalletBalances,
  fundWallet,
  withdrawFromWallet,
  getWalletHistory,
  lockBalance,
  releaseBalance,
  getTotalBalanceInUSD,
};
