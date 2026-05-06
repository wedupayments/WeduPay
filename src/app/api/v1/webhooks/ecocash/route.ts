/**
 * EcoCash Webhook Endpoint
 * 
 * Receives payment callbacks from EcoCash Zimbabwe.
 * Processes payment confirmations and updates transaction status.
 * 
 * @endpoint POST /api/v1/webhooks/ecocash
 * 
 * @body {Object} payload - EcoCash callback payload
 * @body {string} payload.transactionId - EcoCash transaction ID
 * @body {string} payload.reference - Merchant reference
 * @body {string} payload.status - Transaction status
 * @body {number} payload.amount - Transaction amount
 * @body {string} payload.currency - Currency code
 * @body {string} payload.customerMsisdn - Customer phone number
 * 
 * @returns {Object} response
 * @returns {boolean} received - Whether webhook was received
 * 
 * @example
 * // EcoCash Callback Payload
 * POST /api/v1/webhooks/ecocash
 * {
 *   "transactionId": "ECW123456789",
 *   "reference": "PAY-123456",
 *   "status": "SUCCESS",
 *   "amount": 50.00,
 *   "currency": "USD",
 *   "customerMsisdn": "263771234567",
 *   "timestamp": "2024-01-15T10:30:45Z"
 * }
 * 
 * // Response
 * { "received": true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/services/webhook/webhook.processor';

export async function POST(request: NextRequest) {
  const requestId = `WH-ECOCASH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[EcoCashWebhook] ${requestId} - Received webhook`);

  try {
    const configuredSecret = process.env.ECOCASH_WEBHOOK_SECRET;
    const signature =
      request.headers.get('x-ecocash-signature') ||
      request.headers.get('x-signature') ||
      request.headers.get('authorization') ||
      undefined;

    if (configuredSecret && signature !== configuredSecret && signature !== `Bearer ${configuredSecret}`) {
      console.error(`[EcoCashWebhook] ${requestId} - Invalid webhook secret`);
      return NextResponse.json(
        { received: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    if (!body || !(body.transactionId || body.reference || body.ecocashReference)) {
      console.error(`[EcoCashWebhook] ${requestId} - Invalid payload structure`);
      return NextResponse.json(
        { received: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Process webhook
    const result = await processWebhook('ecocash', body);

    if (result.success) {
      console.log(`[EcoCashWebhook] ${requestId} - Processed successfully:`, result);
      return NextResponse.json({ received: true });
    } else {
      console.error(`[EcoCashWebhook] ${requestId} - Processing failed:`, result.error);
      return NextResponse.json(
        { received: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[EcoCashWebhook] ${requestId} - Error:`, error);

    return NextResponse.json(
      { received: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing webhook connectivity
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'ecocash',
    timestamp: new Date().toISOString(),
  });
}
