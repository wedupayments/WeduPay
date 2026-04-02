/**
 * P2P Transfer Quote API
 * 
 * Get a quote for cross-border P2P transfer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { P2PTransferService } from '@/services/routing/p2p-transfer-service';

const p2pService = new P2PTransferService();

// ============================================
// REQUEST VALIDATION
// ============================================

const quoteRequestSchema = z.object({
  sendAmount: z.number().positive('Amount must be positive'),
  sendCurrency: z.string().length(3, 'Invalid currency code'),
  recipientPhone: z.string().min(10, 'Invalid phone number'),
  recipientCountry: z.string().length(2, 'Invalid country code'),
  recipientName: z.string().optional(),
  recipientWalletType: z.string().optional(),
  description: z.string().optional(),
});

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[P2PQuoteAPI] ${requestId} - Received quote request`);

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = quoteRequestSchema.parse(body);

    // Get transfer quote
    const quote = await p2pService.getTransferQuote({
      userId: 'anonymous', // Would be from auth session
      ...validatedData,
    });

    // Get transfer limits
    const limits = await p2pService.getTransferLimits(
      validatedData.recipientCountry,
      quote.receiveCurrency
    );

    return NextResponse.json({
      success: true,
      requestId,
      quote: {
        sendAmount: quote.sendAmount,
        sendCurrency: quote.sendCurrency,
        receiveAmount: quote.receiveAmount,
        receiveCurrency: quote.receiveCurrency,
        exchangeRate: quote.exchangeRate,
        fees: quote.fees,
        totalDebit: quote.totalDebit,
        estimatedDelivery: quote.estimatedDelivery,
        route: quote.route,
      },
      limits: {
        transactionMin: limits.transactionMin,
        transactionMax: limits.transactionMax,
        dailyMax: limits.dailyMax,
        kycRequired: limits.kycRequired,
      },
      validFor: 600, // Quote valid for 10 minutes
    });

  } catch (error) {
    console.error(`[P2PQuoteAPI] ${requestId} - Error:`, error);

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
