/**
 * Fund Wallet API
 * 
 * Adds funds to user's wallet from external payment source.
 * Creates transaction record and updates wallet balance atomically.
 * 
 * @endpoint POST /api/v1/wallets/fund
 * 
 * @body {Object} request - Fund request
 * @body {string} request.currency - Currency code (e.g., 'USD', 'KES')
 * @body {number} request.amount - Amount to deposit
 * @body {string} request.source - Payment source ('mobile_money', 'card', 'bank')
 * @body {string} request.sourceReference - External payment reference
 * @body {string} request.description - Optional description
 * 
 * @returns {Object} response
 * @returns {boolean} success - Whether the operation succeeded
 * @returns {string} walletId - Wallet ID
 * @returns {number} previousBalance - Balance before deposit
 * @returns {number} newBalance - Balance after deposit
 * @returns {string} transactionId - Transaction reference
 * 
 * @example
 * // Request
 * POST /api/v1/wallets/fund
 * {
 *   "currency": "USD",
 *   "amount": 100,
 *   "source": "mobile_money",
 *   "sourceReference": "MPESA-LGR123456",
 *   "description": "Deposit from M-Pesa"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "walletId": "wallet-123",
 *   "previousBalance": 400.00,
 *   "newBalance": 500.00,
 *   "transactionId": "DEP-1234567890",
 *   "message": "Wallet funded successfully"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fundWallet } from '@/services/wallet-balance.service';

/**
 * Request validation schema
 * Ensures all required fields are present and valid
 */
const fundWalletSchema = z.object({
  currency: z.string().length(3, 'Invalid currency code'),
  amount: z.number().positive('Amount must be positive'),
  source: z.enum(['mobile_money', 'card', 'bank_transfer'], {
    errorMap: () => ({ message: 'Invalid payment source' }),
  }),
  sourceReference: z.string().optional(),
  description: z.string().optional(),
  walletId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[FundWalletAPI] ${requestId} - Funding wallet`);

  try {
    // Parse and validate request
    const body = await request.json();
    const validation = fundWalletSchema.safeParse(body);

    if (!validation.success) {
      console.error(`[FundWalletAPI] ${requestId} - Validation failed:`, validation.error.errors);
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

    // Process deposit
    const result = await fundWallet({
      userId,
      walletId: validation.data.walletId,
      currency: validation.data.currency,
      amount: validation.data.amount,
      source: validation.data.source,
      sourceReference: validation.data.sourceReference,
      description: validation.data.description,
    });

    if (result.success) {
      console.log(`[FundWalletAPI] ${requestId} - Wallet funded successfully`);
      
      return NextResponse.json(
        {
          success: true,
          walletId: result.walletId,
          previousBalance: result.previousBalance,
          newBalance: result.newBalance,
          transactionId: result.transactionId,
          message: 'Wallet funded successfully',
        },
        { status: 201 }
      );
    } else {
      console.error(`[FundWalletAPI] ${requestId} - Funding failed:`, result.error);
      
      const statusMap: Record<string, number> = {
        'INVALID_AMOUNT': 400,
        'EXCEEDS_LIMIT': 400,
        'DEPOSIT_FAILED': 500,
      };

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: statusMap[result.errorCode || 'DEPOSIT_FAILED'] || 500 }
      );
    }
  } catch (error) {
    console.error(`[FundWalletAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fund wallet',
      },
      { status: 500 }
    );
  }
}
