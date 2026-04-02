/**
 * Flutterwave Webhook Endpoint
 * 
 * Receives payment callbacks from Flutterwave.
 * Processes payment confirmations and updates transaction status.
 * 
 * IMPORTANT: Configure your Flutterwave webhook URL in the dashboard:
 * Settings → Webhooks → Live/Testing Webhook URL
 * 
 * @endpoint POST /api/v1/webhooks/flutterwave
 * 
 * @body {Object} data - Flutterwave event data
 * @body {string} event - Event type (charge.completed, transfer.completed, etc.)
 * @body {Object} data.id - Transaction ID
 * @body {string} data.tx_ref - Merchant reference
 * @body {string} data.status - Transaction status
 * @body {number} data.amount - Transaction amount
 * @body {string} data.currency - Currency code
 * 
 * @returns {Object} response
 * @returns {boolean} status - Whether webhook was received
 * 
 * @example
 * // Flutterwave Callback Payload
 * POST /api/v1/webhooks/flutterwave
 * {
 *   "event": "charge.completed",
 *   "data": {
 *     "id": 123456,
 *     "tx_ref": "PAY-123456",
 *     "status": "successful",
 *     "amount": 50.00,
 *     "currency": "USD",
 *     "meta": {
 *       "userId": "user-123"
 *     }
 *   }
 * }
 * 
 * // Response
 * { "status": "success" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/services/webhook/webhook.processor';

export async function POST(request: NextRequest) {
  const requestId = `WH-FLUTTERWAVE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[FlutterwaveWebhook] ${requestId} - Received webhook`);

  try {
    // Parse request body
    const body = await request.json();

    // Flutterwave sends different event types
    const event = body.event;
    
    // Only process payment-related events
    const paymentEvents = ['charge.completed', 'charge.successful', 'transfer.completed'];
    if (!paymentEvents.includes(event)) {
      console.log(`[FlutterwaveWebhook] ${requestId} - Ignoring non-payment event: ${event}`);
      return NextResponse.json({ status: 'success', message: 'Event ignored' });
    }

    if (!body.data || !body.data.tx_ref) {
      console.error(`[FlutterwaveWebhook] ${requestId} - Invalid payload structure`);
      return NextResponse.json(
        { status: 'error', message: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Get signature from headers for verification
    const signature = request.headers.get('verif-hash') || undefined;

    // Process webhook
    const result = await processWebhook('flutterwave', body, signature);

    if (result.success) {
      console.log(`[FlutterwaveWebhook] ${requestId} - Processed successfully:`, result);
      return NextResponse.json({ status: 'success' });
    } else {
      console.error(`[FlutterwaveWebhook] ${requestId} - Processing failed:`, result.error);
      return NextResponse.json(
        { status: 'error', message: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[FlutterwaveWebhook] ${requestId} - Error:`, error);

    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
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
    provider: 'flutterwave',
    timestamp: new Date().toISOString(),
  });
}
