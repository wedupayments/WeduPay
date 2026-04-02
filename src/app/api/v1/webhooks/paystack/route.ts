/**
 * Paystack Webhook Endpoint
 * 
 * Receives payment callbacks from Paystack.
 * Processes payment confirmations and updates transaction status.
 * 
 * IMPORTANT: Configure your Paystack webhook URL in the dashboard:
 * Settings → API Keys & Webhooks → Webhook URL
 * 
 * @endpoint POST /api/v1/webhooks/paystack
 * 
 * @body {string} event - Event type (charge.success, transfer.success, etc.)
 * @body {Object} data - Paystack event data
 * @body {number} data.id - Transaction ID
 * @body {string} data.reference - Merchant reference
 * @body {string} data.status - Transaction status
 * @body {number} data.amount - Transaction amount (in kobo/pesewas)
 * @body {string} data.currency - Currency code
 * 
 * @returns {Object} response
 * @returns {boolean} status - Whether webhook was received
 * 
 * @example
 * // Paystack Callback Payload
 * POST /api/v1/webhooks/paystack
 * {
 *   "event": "charge.success",
 *   "data": {
 *     "id": 123456,
 *     "reference": "PAY-123456",
 *     "status": "success",
 *     "amount": 5000,
 *     "currency": "NGN",
 *     "paid_at": "2024-01-15T10:30:45Z"
 *   }
 * }
 * 
 * // Response
 * { "status": "success" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/services/webhook/webhook.processor';

export async function POST(request: NextRequest) {
  const requestId = `WH-PAYSTACK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[PaystackWebhook] ${requestId} - Received webhook`);

  try {
    // Parse request body
    const body = await request.json();

    // Paystack sends different event types
    const event = body.event;
    
    // Only process payment-related events
    const paymentEvents = [
      'charge.success',
      'charge.successful',
      'transfer.success',
      'transfer.successful',
    ];
    
    if (!paymentEvents.includes(event)) {
      console.log(`[PaystackWebhook] ${requestId} - Ignoring non-payment event: ${event}`);
      return NextResponse.json({ status: 'success', message: 'Event ignored' });
    }

    if (!body.data || !body.data.reference) {
      console.error(`[PaystackWebhook] ${requestId} - Invalid payload structure`);
      return NextResponse.json(
        { status: 'error', message: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Get signature from headers for verification
    const signature = request.headers.get('x-paystack-signature') || undefined;

    // Process webhook
    const result = await processWebhook('paystack', body, signature);

    if (result.success) {
      console.log(`[PaystackWebhook] ${requestId} - Processed successfully:`, result);
      return NextResponse.json({ status: 'success' });
    } else {
      console.error(`[PaystackWebhook] ${requestId} - Processing failed:`, result.error);
      return NextResponse.json(
        { status: 'error', message: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[PaystackWebhook] ${requestId} - Error:`, error);

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
    provider: 'paystack',
    timestamp: new Date().toISOString(),
  });
}
