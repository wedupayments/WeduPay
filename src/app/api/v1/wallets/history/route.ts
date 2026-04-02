/**
 * Wallet Transaction History API
 * 
 * Retrieves transaction history for user's wallets.
 * Supports filtering by type and pagination.
 * 
 * @endpoint GET /api/v1/wallets/history
 * 
 * @query {string} type - Optional transaction type filter ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 * 
 * @returns {Object} response
 * @returns {boolean} success - Whether the operation succeeded
 * @returns {Array} transactions - Array of transactions
 * @returns {Object} pagination - Pagination metadata
 * @returns {number} pagination.page - Current page
 * @returns {number} pagination.limit - Items per page
 * @returns {number} pagination.total - Total items
 * @returns {number} pagination.totalPages - Total pages
 * 
 * @example
 * // Request
 * GET /api/v1/wallets/history?type=DEPOSIT&page=1&limit=10
 * 
 * // Response
 * {
 *   "success": true,
 *   "transactions": [
 *     {
 *       "id": "txn-123",
 *       "type": "DEPOSIT",
 *       "amount": 100.00,
 *       "currency": "USD",
 *       "status": "COMPLETED",
 *       "reference": "DEP-1234567890",
 *       "createdAt": "2024-01-15T10:30:00Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 25,
 *     "totalPages": 3
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletHistory } from '@/services/wallet-balance.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Query validation schema
 */
const historyQuerySchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[WalletHistoryAPI] ${requestId} - Getting wallet history`);

  try {
    const { searchParams } = new URL(request.url);
    const validation = historyQuerySchema.safeParse({
      type: searchParams.get('type'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
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

    // Get user's wallets
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: { id: true },
    });

    if (wallets.length === 0) {
      return NextResponse.json({
        success: true,
        transactions: [],
        pagination: {
          page: parseInt(validation.data.page),
          limit: parseInt(validation.data.limit),
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Get transaction history across all wallets
    const page = parseInt(validation.data.page);
    const limit = parseInt(validation.data.limit);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    if (validation.data.type) {
      where.type = validation.data.type;
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

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        reference: t.reference,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`[WalletHistoryAPI] ${requestId} - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get history',
      },
      { status: 500 }
    );
  }
}
