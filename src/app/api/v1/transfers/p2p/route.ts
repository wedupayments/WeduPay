/**
 * P2P Transfer Execute API
 * 
 * Execute a cross-border P2P transfer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { P2PTransferService } from '@/services/routing/p2p-transfer-service';

const p2pService = new P2PTransferService();

// ============================================
// REQUEST VALIDATION
// ============================================

const transferRequestSchema = z.object({
  sendAmount: z.number().positive('Amount must be positive'),
  sendCurrency: z.string().length(3, 'Invalid currency code'),
  recipientPhone: z.string().min(10, 'Invalid phone number'),
  recipientCountry: z.string().length(2, 'Invalid country code'),
  recipientName: z.string().optional(),
  recipientWalletType: z.string().optional(),
  description: z.string().optional(),
  saveRecipient: z.boolean().optional().default(false),
  quoteId: z.string().optional(), // Optional: reference to a previously obtained quote
});

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[P2PTransferAPI] ${requestId} - Received transfer request`);

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = transferRequestSchema.parse(body);

    // Execute transfer
    const result = await p2pService.executeTransfer({
      userId: 'user-123', // Would be from auth session
      ...validatedData,
    });

    const statusCode = result.success ? 201 : 400;

    return NextResponse.json({
      success: result.success,
      requestId,
      transfer: {
        id: result.transferId,
        reference: result.transferRef,
        status: result.status,
        message: result.message,
      },
      recipient: {
        phone: result.recipientPhone,
        country: result.recipientCountry,
      },
      amount: {
        send: result.receiveAmount, // Note: This should be sendAmount from quote
        receive: result.receiveAmount,
        currency: result.receiveCurrency,
      },
      delivery: {
        estimated: result.estimatedDelivery,
        providerReference: result.providerReference,
      },
      nextSteps: getNextSteps(result.status),
    }, { status: statusCode });

  } catch (error) {
    console.error(`[P2PTransferAPI] ${requestId} - Error:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        requestId,
        error: 'Validation error',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function getNextSteps(status: string): string[] {
  switch (status) {
    case 'COMPLETED':
      return [
        'Transfer completed successfully',
        'Recipient has received the funds',
        'A confirmation email has been sent',
      ];
    case 'PENDING_REVIEW':
      return [
        'Transfer is under compliance review',
        'This usually takes 1-2 business hours',
        'You will be notified once approved',
      ];
    case 'PROCESSING':
      return [
        'Transfer is being processed',
        'Recipient will receive funds shortly',
        'You can track the status using the transfer reference',
      ];
    default:
      return [
        'Contact support if you need assistance',
        `Reference: Keep your transfer reference for tracking`,
      ];
  }
}
