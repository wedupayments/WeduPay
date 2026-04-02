/**
 * Payment Routing API
 * 
 * Intelligent payment routing endpoint that automatically
 * selects the best provider for each transaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  MoneyRoutingEngine,
  RoutingStrategy,
} from '@/services/routing/money-routing-engine';
import { AfricanWalletFactory, WalletType } from '@/services/wallets/unified-wallet-factory';

const routingEngine = new MoneyRoutingEngine();

// ============================================
// REQUEST VALIDATION
// ============================================

const paymentRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Invalid currency code'),
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  country: z.string().length(2, 'Invalid country code'),
  reference: z.string().min(1, 'Reference is required'),
  description: z.string().optional(),
  email: z.string().email().optional(),
  callbackUrl: z.string().url().optional(),
  providerType: z.nativeEnum(WalletType).optional(),
  routingStrategy: z.nativeEnum(RoutingStrategy).optional(),
  maxRetries: z.number().min(1).max(5).optional().default(3),
  preferredProviders: z.array(z.string()).optional(),
  excludedProviders: z.array(z.string()).optional(),
  requireInstantConfirmation: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[RoutingAPI] ${requestId} - Received payment routing request`);

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = paymentRequestSchema.parse(body);

    // Create routing context
    const routingContext = {
      amount: validatedData.amount,
      currency: validatedData.currency,
      destinationCountry: validatedData.country,
      providerType: validatedData.providerType,
      transactionId: validatedData.reference,
      metadata: validatedData.metadata,
    };

    // Get routing options
    const routingOptions = {
      strategy: validatedData.routingStrategy,
      maxRetries: validatedData.maxRetries,
      preferredProviders: validatedData.preferredProviders,
      excludedProviders: validatedData.excludedProviders,
      requireInstantConfirmation: validatedData.requireInstantConfirmation,
    };

    // Step 1: Find optimal route (without executing)
    const routingDecision = await routingEngine.routePayment(routingContext, routingOptions);

    console.log(`[RoutingAPI] ${requestId} - Routing decision:`, routingDecision);

    // Step 2: Execute payment with routing
    const paymentRequest = {
      phoneNumber: validatedData.phoneNumber,
      amount: validatedData.amount,
      currency: validatedData.currency,
      reference: validatedData.reference,
      description: validatedData.description || 'Payment',
      callbackUrl: validatedData.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`,
      email: validatedData.email,
    };

    const result = await routingEngine.executePayment(
      routingContext,
      paymentRequest,
      routingOptions
    );

    console.log(`[RoutingAPI] ${requestId} - Payment result:`, result);

    return NextResponse.json({
      success: result.success,
      requestId,
      transactionId: result.transactionId,
      routedTransactionId: result.routedTransactionId,
      provider: result.provider,
      providerReference: result.providerReference,
      status: result.status,
      message: result.message,
      attempts: result.attempts,
      routing: {
        selectedProvider: routingDecision.selectedProvider,
        routingReason: routingDecision.reason,
        score: routingDecision.score,
        estimatedFee: routingDecision.estimatedFee,
        estimatedTime: routingDecision.estimatedTime,
        successProbability: routingDecision.successProbability,
        alternatives: routingDecision.alternatives.map(a => ({
          provider: a.providerName,
          score: a.score,
        })),
      },
      routingHistory: result.routingHistory.map(h => ({
        provider: h.selectedProvider,
        reason: h.reason,
        score: h.score,
      })),
    }, {
      status: result.success ? 200 : 400,
    });

  } catch (error) {
    console.error(`[RoutingAPI] ${requestId} - Error:`, error);

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

// ============================================
// GET FEE QUOTES
// ============================================

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[RoutingAPI] ${requestId} - Received fee quotes request`);

  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '0');
    const currency = searchParams.get('currency') || 'USD';
    const country = searchParams.get('country') || '';

    if (!amount || !currency || !country) {
      return NextResponse.json({
        success: false,
        requestId,
        error: 'Missing required parameters: amount, currency, country',
      }, { status: 400 });
    }

    const feeQuotes = await routingEngine.getFeeQuotes({
      amount,
      currency,
      destinationCountry: country,
    });

    return NextResponse.json({
      success: true,
      requestId,
      quotes: feeQuotes,
      bestQuote: feeQuotes.reduce((best, current) =>
        current.feeAmount < best.feeAmount ? current : best
      ),
    });

  } catch (error) {
    console.error(`[RoutingAPI] ${requestId} - Error:`, error);

    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
