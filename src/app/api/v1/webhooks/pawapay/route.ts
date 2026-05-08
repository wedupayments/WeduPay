/**
 * PawaPay Webhook Endpoint
 *
 * Receives deposit, payout, and refund callbacks from PawaPay.
 *
 * @endpoint POST /api/v1/webhooks/pawapay
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/services/webhook/webhook.processor';

export async function POST(request: NextRequest) {
  const requestId = `WH-PAWAPAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[PawaPayWebhook] ${requestId} - Received webhook`);

  try {
    const configuredSecret = process.env.PAWAPAY_WEBHOOK_SECRET;
    const signature =
      request.headers.get('x-pawapay-signature') ||
      request.headers.get('x-signature') ||
      request.headers.get('authorization') ||
      undefined;

    if (configuredSecret && signature !== configuredSecret && signature !== `Bearer ${configuredSecret}`) {
      console.error(`[PawaPayWebhook] ${requestId} - Invalid webhook secret`);
      return NextResponse.json(
        { received: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body || !(body.depositId || body.payoutId || body.refundId || body.transactionId || body.id)) {
      console.error(`[PawaPayWebhook] ${requestId} - Invalid payload structure`);
      return NextResponse.json(
        { received: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const result = await processWebhook('pawapay', body);

    if (result.success) {
      console.log(`[PawaPayWebhook] ${requestId} - Processed successfully:`, result);
      return NextResponse.json({ received: true });
    }

    console.error(`[PawaPayWebhook] ${requestId} - Processing failed:`, result.error);
    return NextResponse.json(
      { received: false, error: result.error },
      { status: 400 }
    );
  } catch (error) {
    console.error(`[PawaPayWebhook] ${requestId} - Error:`, error);

    return NextResponse.json(
      { received: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'pawapay',
    timestamp: new Date().toISOString(),
  });
}
