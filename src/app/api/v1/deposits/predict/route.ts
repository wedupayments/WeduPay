/**
 * Provider Prediction API
 *
 * POST /api/v1/deposits/predict — Predict the mobile network operator (MNO)
 * for a given phone number before initiating a deposit.
 *
 * Useful for the UI to display the detected provider so the user can
 * confirm before submitting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pawapayAPI } from '@/lib/pawapay';
import { authenticateRequest, requireAuth } from '@/lib/auth';

const predictSchema = z.object({
  phoneNumber: z.string().min(9, 'Phone number too short'),
  country: z.string().min(2).max(3).optional(),
});

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) return authError;

    const body = await request.json();
    const parsed = predictSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const result = await pawapayAPI.predictProvider(parsed.data);

    if (result.status === 'FAILED') {
      return NextResponse.json(
        { success: false, error: result.message || 'Unable to predict provider' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId,
      provider: result.provider,
      country: result.country,
    });
  } catch (error) {
    console.error(`[PredictProviderAPI] ${requestId} - Error:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
