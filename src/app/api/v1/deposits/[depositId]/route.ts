/**
 * Deposit Status API
 *
 * GET /api/v1/deposits/[depositId] — Poll PawaPay for the current deposit status.
 *
 * Use this to check status when a webhook has not yet been received.
 * Final status is always authoritative from the webhook.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pawapayAPI } from '@/lib/pawapay';
import { authenticateRequest, requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ depositId: string }> }
) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) return authError;

    const { depositId } = await params;

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: 'depositId is required' },
        { status: 400 }
      );
    }

    const status = await pawapayAPI.getDepositStatus(depositId);

    return NextResponse.json({
      success: true,
      requestId,
      depositId,
      status: status.status,
      amount: status.amount,
      currency: status.currency,
      provider: status.provider,
      providerReference: status.providerReference,
      transactionDate: status.transactionDate,
    });
  } catch (error) {
    console.error(`[DepositStatusAPI] ${requestId} - Error:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
