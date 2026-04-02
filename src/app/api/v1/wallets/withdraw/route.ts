/**
 * Withdraw from Wallet API
 * 
 * Removes funds from user's wallet and sends to external destination.
 * Validates sufficient balance before processing.
 * 
 * @endpoint POST /api/v1/wallets/withdraw
 * 
 * @body {Object} request - Withdrawal request
 * @body {string} request.currency - Currency code (e.g., 'USD', 'KES')
 * @body {number} request.amount - Amount to withdraw
 * @body {string} request.destination - Destination type ('mobile_money', 'bank_account')
 * @body {string} request.destinationPhone - Phone number for mobile money
 * @body {string} request.destinationAccount - Account number for bank transfer
 * @body {string} request.description - Optional description
 * 
 * @returns {Object} response
 * @returns {boolean} success - Whether the operation succeeded
 * @returns {string} walletId - Wallet ID
 * @returns {number} previousBalance - Balance before withdrawal
 * @returns {number} newBalance - Balance after withdrawal
 * @returns {string} transactionId - Transaction reference
 * 
 * @example
 * // Request
 * POST /api/v1/wallets/withdraw
 * {
 *   "currency": "USD",
 *   "amount": 50,
 *   "destination": "mobile_money",
 *   "destinationPhone": "254712345678",
 *   "description": "Withdrawal to M-Pesa"
 * }
 * 
 * // Response (Success)
 * {
 *   "success": true,
 *   "walletId": "wallet-123",
 *   "previousBalance": 500.00,
 *   "newBalance": 450.00,
 *   "transactionId": "WDR-1234567890",
 *   "message": "Withdrawal processed successfully"
 * }
 * 
 * // Response (Insufficient Funds)
 * {
 *   "success": false,
 *   "error": "Insufficient funds. Available: 30.00 USD",
 *   "errorCode": "INSUFFICIENT_FUNDS"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withdrawFromWallet } from '@/services/wallet-balance.service';

/**
 * Request validation schema
 * Ensures all required fields are present and valid
 */
const withdrawSchema = z.object({
  currency: z.string().length(3, 'Invalid currency code'),
  amount: z.number().positive('Amount must be positive'),
  destination: z.enum(['mobile_money', 'bank_account'], {
    errorMap: () => ({ message: 'Invalid destination type' }),
  }),
  destinationPhone: z.string().optional(),
  destinationAccount: z.string().optional(),
  description: z.string().optional(),
  walletId: z.string().optional(),
}).refine(
  (data) => {
    // Validate destination details based on type
    if (data.destination === 'mobile_money' && !data.destinationPhone) {
      return false;
    }
    if (data.destination === 'bank_account' && !data.destinationAccount) {
      return false;
    }
    return true;
  },
  {
    message: 'Destination phone or account number is required',
    path: ['destinationPhone'],
  }
);

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[WithdrawWalletAPI] ${requestId} - Withdrawing from wallet`);

  try {
    // Parse and validate request
    const body = await request.json();
    const validation = withdrawSchema.safeParse(body);

    if (!validation.success) {
      console.error(`[WithdrawWalletAPI] ${requestId} - Validation failed:`, validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

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

    // Process withdrawal
    const result = await withdrawFromWallet({
      userId,
      walletId: validation.data.walletId,
      currency: validation.data.currency,
      amount: validation.data.amount,
      destination: validation.data.destination,
      destinationPhone: validation.data.destinationPhone,
      destinationAccount: validation.data.destinationAccount,
      description: validation.data.description,
    });

    if (result.success) {
      console.log(`[WithdrawWalletAPI] ${requestId} - Withdrawal successful`);
      
      return NextResponse.json(
        {
          success: true,
          walletId: result.walletId,
          previousBalance: result.previousBalance,
          newBalance: result.newBalance,
          transactionId: result.transactionId,
          message: 'Withdrawal processed successfully',
        },
        { status: 200 }
      );
    } else {
      console.error(`[WithdrawWalletAPI] ${requestId} - Withdrawal failed:`, result.error);
      
      const statusMap: Record<string, number> = {
        'INVALID_AMOUNT': 400,
        'WALLET_NOT_FOUND': 404,
        'INSUFFICIENT_FUNDS': 400,
        'BELOW_MIN_BALANCE': 400,
        'WITHDRAWAL_FAILED': 500,
      };

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: statusMap[result.errorCode || 'WITHDRAWAL_FAILED'] || 500 }
      );
    }
  } catch (error) {
    console.error(`[WithdrawWalletAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to withdraw from wallet',
      },
      { status: 500 }
    );
  }
}
