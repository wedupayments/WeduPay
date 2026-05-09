/**
 * Deposits API
 *
 * POST /api/v1/deposits — Initiate a mobile money deposit via PawaPay.
 *
 * Flow:
 *  1. Validate request body
 *  2. Auto-detect MNO via PawaPay /v2/predict-provider when no provider given
 *  3. Call PawaPay /v2/deposits — returns PENDING immediately (async)
 *  4. Persist a Transaction record (type FUNDING, status PENDING)
 *  5. Return depositId; final status delivered via POST /api/v1/webhooks/pawapay
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pawapayAPI } from '@/lib/pawapay';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, requireAuth, requireAppUser } from '@/lib/auth';

const depositSchema = z.object({
  phoneNumber: z.string().min(9, 'Phone number too short'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  description: z.string().max(22).optional().default('WeduPay deposit'),
  provider: z.string().optional(),
  country: z.string().length(2).optional(),
  walletId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[DepositsAPI] ${requestId} - Received deposit request`);

  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) return authError;
    const profileError = requireAppUser(auth);
    if (profileError) return profileError;

    const body = await request.json();
    const parsed = depositSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { phoneNumber, amount, currency, description, provider, country, walletId } = parsed.data;
    const userId = auth.userId!;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/pawapay`;

    // Initiate deposit with PawaPay
    const depositResult = await pawapayAPI.initiateDeposit({
      phoneNumber,
      amount,
      currency,
      reference: requestId,
      description,
      callbackUrl,
      provider,
      country,
    });

    if (depositResult.status === 'FAILED') {
      return NextResponse.json(
        { success: false, error: depositResult.message || 'Deposit initiation failed' },
        { status: 502 }
      );
    }

    // Persist transaction record so the webhook can credit the wallet
    await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency,
        type: 'FUNDING',
        status: 'PENDING',
        reference: requestId,
        metadata: {
          depositId: depositResult.transactionId,
          provider: depositResult.provider,
          phoneNumber,
          walletId: walletId || null,
          callbackUrl,
        } as object,
      },
    });

    console.log(`[DepositsAPI] ${requestId} - Deposit initiated: ${depositResult.transactionId}`);

    return NextResponse.json(
      {
        success: true,
        requestId,
        depositId: depositResult.transactionId,
        status: depositResult.status,
        provider: depositResult.provider,
        message: 'Deposit initiated. Funds will be credited to your wallet upon confirmation.',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error(`[DepositsAPI] ${requestId} - Error:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
