/**
 * MTN Mobile Money Webhook Endpoint
 * 
 * Receives collection callbacks from MTN Mobile Money.
 * Processes payment confirmations and updates transaction status.
 * 
 * @endpoint POST /api/v1/webhooks/mtn
 * 
 * @body {Object} payload - MTN callback payload
 * @body {string} payload.referenceId - MTN reference ID
 * @body {string} payload.status - Transaction status (SUCCESSFUL, FAILED, etc.)
 * @body {Object} payload.amount - Amount object
 * @body {number} payload.amount.amount - Amount value
 * @body {string} payload.amount.currency - Currency code
 * @body {Object} payload.payer - Payer information
 * 
 * @returns {Object} response
 * @returns {boolean} received - Whether webhook was received
 * 
 * @example
 * // MTN Callback Payload
 * POST /api/v1/webhooks/mtn
 * {
 *   "referenceId": "MTN123456789",
 *   "status": "SUCCESSFUL",
 *   "amount": {
 *     "amount": "50.00",
 *     "currency": "USD"
 *   },
 *   "payer": {
 *     "partyIdType": "MSISDN",
 *     "partyId": "256771234567"
 *   },
 *   "modificationDate": "2024-01-15T10:30:45Z"
 * }
 * 
 * // Response
 * { "received": true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/services/webhook/webhook.processor';

export async function POST(request: NextRequest) {
  const requestId = `WH-MTN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[MTNWebhook] ${requestId} - Received webhook`);

  try {
    // Parse request body
    const body = await request.json();

    if (!body || !body.referenceId) {
      console.error(`[MTNWebhook] ${requestId} - Invalid payload structure`);
      return NextResponse.json(
        { received: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Process webhook
    const result = await processWebhook('mtn', body);

    if (result.success) {
      console.log(`[MTNWebhook] ${requestId} - Processed successfully:`, result);
      return NextResponse.json({ received: true });
    } else {
      console.error(`[MTNWebhook] ${requestId} - Processing failed:`, result.error);
      return NextResponse.json(
        { received: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[MTNWebhook] ${requestId} - Error:`, error);

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
    provider: 'mtn',
    timestamp: new Date().toISOString(),
  });
}
