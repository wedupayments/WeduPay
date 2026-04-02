/**
 * Get Wallet Balance API
 * 
 * Retrieves wallet balance for authenticated user.
 * Supports single currency query or all wallets.
 * 
 * @endpoint GET /api/v1/wallets/balance
 * 
 * @query {string} currency - Optional currency code (e.g., 'USD', 'KES')
 * @query {boolean} all - If true, return all wallet balances
 * 
 * @returns {Object} response
 * @returns {boolean} success - Whether the operation succeeded
 * @returns {Object|Array} balance - Wallet balance data
 * @returns {number} balance.balance - Current balance
 * @returns {number} balance.availableBalance - Available for spending
 * @returns {number} balance.pendingBalance - Pending in transactions
 * 
 * @example
 * // Request - Single currency
 * GET /api/v1/wallets/balance?currency=USD
 * 
 * // Response
 * {
 *   "success": true,
 *   "balance": {
 *     "walletId": "wallet-123",
 *     "currency": "USD",
 *     "balance": 500.00,
 *     "availableBalance": 450.00,
 *     "pendingBalance": 50.00
 *   }
 * }
 * 
 * @example
 * // Request - All wallets
 * GET /api/v1/wallets/balance?all=true
 * 
 * // Response
 * {
 *   "success": true,
 *   "balances": [
 *     { "currency": "USD", "balance": 500.00, "availableBalance": 450.00 },
 *     { "currency": "KES", "balance": 10000.00, "availableBalance": 10000.00 }
 *   ],
 *   "totalUSD": 585.50
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getWalletBalance,
  getAllWalletBalances,
  getTotalBalanceInUSD,
} from '@/services/wallet-balance.service';

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[WalletBalanceAPI] ${requestId} - Getting wallet balance`);

  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const all = searchParams.get('all') === 'true';
    
    // Get user ID from auth (would be from session in real implementation)
    const userId = request.headers.get('x-user-id') || 'user-123';

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Return all wallet balances
    if (all) {
      const balances = await getAllWalletBalances(userId);
      const totalUSD = await getTotalBalanceInUSD(userId);

      return NextResponse.json({
        success: true,
        balances: balances.map(b => ({
          walletId: b.walletId,
          currency: b.currency,
          balance: b.balance,
          availableBalance: b.availableBalance,
          pendingBalance: b.pendingBalance,
        })),
        totalUSD: totalUSD.totalUSD,
        breakdown: totalUSD.balances,
      });
    }

    // Return single currency balance
    const balance = await getWalletBalance(userId, currency || 'USD');

    return NextResponse.json({
      success: true,
      balance: {
        walletId: balance.walletId,
        currency: balance.currency,
        balance: balance.balance,
        availableBalance: balance.availableBalance,
        pendingBalance: balance.pendingBalance,
      },
    });
  } catch (error) {
    console.error(`[WalletBalanceAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balance',
      },
      { status: 500 }
    );
  }
}
