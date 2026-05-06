/**
 * M-Pesa Webhook Endpoint
 * 
 * Receives STK push callbacks from Safaricom M-Pesa.
 * Processes payment confirmations and updates transaction status.
 * 
 * @endpoint POST /api/v1/webhooks/mpesa
 * 
 * @body {Object} Body - M-Pesa callback payload
 * @body {Object} Body.stkCallback - STK callback data
 * @body {string} Body.stkCallback.MerchantRequestID - Merchant request ID
 * @body {string} Body.stkCallback.CheckoutRequestID - Checkout request ID
 * @body {number} Body.stkCallback.ResultCode - Result code (0 = success)
 * @body {string} Body.stkCallback.ResultDesc - Result description
 * @body {Array} Body.stkCallback.CallbackMetadata - Transaction metadata
 * 
 * @returns {Object} response
 * @returns {boolean} received - Whether webhook was received
 * 
 * @example
 * // M-Pesa Callback Payload
 * POST /api/v1/webhooks/mpesa
 * {
 *   "Body": {
 *     "stkCallback": {
 *       "MerchantRequestID": "PAY-123456",
 *       "CheckoutRequestID": "ws_CO_123456789",
 *       "ResultCode": 0,
 *       "ResultDesc": "The service request is processed successfully.",
 *       "CallbackMetadata": {
 *         "Item": [
 *           { "Name": "Amount", "Value": 5000 },
 *           { "Name": "MpesaReceiptNumber", "Value": "LGR123456" },
 *           { "Name": "TransactionDate", "Value": 20240115103045 },
 *           { "Name": "PhoneNumber", "Value": "254712345678" }
 *         ]
 *       }
 *     }
 *   }
 * }
 * 
 * // Response
 * { "received": true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/services/webhook/webhook.processor';

export async function POST(request: NextRequest) {
  const requestId = `WH-MPESA-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[MpesaWebhook] ${requestId} - Received webhook`);

  try {
    const configuredSecret = process.env.MPESA_WEBHOOK_SECRET;
    const signature =
      request.headers.get('x-mpesa-signature') ||
      request.headers.get('x-signature') ||
      request.headers.get('authorization') ||
      undefined;

    if (configuredSecret && signature !== configuredSecret && signature !== `Bearer ${configuredSecret}`) {
      console.error(`[MpesaWebhook] ${requestId} - Invalid webhook secret`);
      return NextResponse.json(
        { received: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    if (!body || !body.Body || !body.Body.stkCallback) {
      console.error(`[MpesaWebhook] ${requestId} - Invalid payload structure`);
      return NextResponse.json(
        { received: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Process webhook
    const result = await processWebhook('mpesa', body);

    if (result.success) {
      console.log(`[MpesaWebhook] ${requestId} - Processed successfully:`, result);
      return NextResponse.json({ received: true });
    } else {
      console.error(`[MpesaWebhook] ${requestId} - Processing failed:`, result.error);
      return NextResponse.json(
        { received: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[MpesaWebhook] ${requestId} - Error:`, error);

    return NextResponse.json(
      { received: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing webhook connectivity
 * M-Pesa may send GET requests to verify endpoint availability
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'mpesa',
    timestamp: new Date().toISOString(),
  });
}
