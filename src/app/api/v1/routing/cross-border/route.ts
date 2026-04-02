/**
 * Cross-Border Routing API
 * 
 * Find optimal cross-border payment routes with
 * FX optimization and multi-leg routing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CrossBorderRoutingEngine } from '@/services/routing/cross-border-routing';

const crossBorderEngine = new CrossBorderRoutingEngine();

// ============================================
// REQUEST VALIDATION
// ============================================

const crossBorderRequestSchema = z.object({
  sourceAmount: z.number().positive('Amount must be positive'),
  sourceCurrency: z.string().length(3, 'Invalid currency code'),
  targetCurrency: z.string().length(3, 'Invalid currency code'),
  destinationCountry: z.string().length(2, 'Invalid country code'),
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  reference: z.string().min(1, 'Reference is required'),
  description: z.string().optional(),
  userId: z.string().optional(),
  execute: z.boolean().optional().default(false), // Just quote or execute
});

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[CrossBorderAPI] ${requestId} - Received cross-border routing request`);

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = crossBorderRequestSchema.parse(body);

    // Step 1: Find optimal route
    const optimization = await crossBorderEngine.findOptimalRoute({
      sourceAmount: validatedData.sourceAmount,
      sourceCurrency: validatedData.sourceCurrency,
      targetCurrency: validatedData.targetCurrency,
      destinationCountry: validatedData.destinationCountry,
      userId: validatedData.userId,
    });

    console.log(`[CrossBorderAPI] ${requestId} - Optimization result:`, optimization);

    // Step 2: Execute if requested
    let executionResult: any = null;
    if (validatedData.execute) {
      executionResult = await crossBorderEngine.executeCrossBorderPayment({
        sourceAmount: validatedData.sourceAmount,
        sourceCurrency: validatedData.sourceCurrency,
        targetCurrency: validatedData.targetCurrency,
        destinationCountry: validatedData.destinationCountry,
        phoneNumber: validatedData.phoneNumber,
        reference: validatedData.reference,
        description: validatedData.description || 'Cross-border payment',
        userId: validatedData.userId,
      });
    }

    return NextResponse.json({
      success: true,
      requestId,
      quote: {
        sourceAmount: optimization.bestRoute.sourceAmount,
        sourceCurrency: optimization.bestRoute.sourceCurrency,
        targetAmount: optimization.bestRoute.targetAmount,
        targetCurrency: optimization.bestRoute.targetCurrency,
        exchangeRate: optimization.bestRoute.exchangeRate,
        fees: optimization.bestRoute.fees,
        recipientGets: optimization.bestRoute.recipientGets,
        route: {
          provider: optimization.bestRoute.route.provider,
          fxRoute: optimization.bestRoute.route.fxRoute,
          legs: optimization.bestRoute.route.legs,
        },
      },
      savings: optimization.savings,
      recommendation: optimization.recommendation,
      alternatives: optimization.allRoutes.slice(1, 4).map((route, i) => ({
        rank: i + 2,
        provider: route.route.provider,
        recipientGets: route.recipientGets,
        exchangeRate: route.exchangeRate,
        totalFees: route.fees.totalFees,
      })),
      execution: executionResult ? {
        success: executionResult.success,
        transactionId: executionResult.transactionId,
        providerReference: executionResult.providerReference,
        status: executionResult.status,
        message: executionResult.message,
      } : null,
    });

  } catch (error) {
    console.error(`[CrossBorderAPI] ${requestId} - Error:`, error);

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
// GET EXCHANGE RATES
// ============================================

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get('base') || 'USD';
    const target = searchParams.get('target');

    if (target) {
      // Get specific rate
      const rate = await crossBorderEngine.getExchangeRate(base, target);

      return NextResponse.json({
        success: true,
        requestId,
        rate: {
          base: rate.baseCurrency,
          target: rate.targetCurrency,
          rate: rate.rate,
          inverseRate: rate.inverseRate,
          effectiveRate: rate.effectiveRate,
          spread: rate.spread,
          margin: rate.margin,
          source: rate.source,
          validUntil: rate.validUntil,
        },
      });
    }

    // Get all rates for base currency
    const currencies = ['EUR', 'GBP', 'KES', 'NGN', 'GHS', 'ZAR', 'TZS', 'UGX', 'ZMW', 'XOF', 'XAF'];
    const rates: any = {};

    for (const currency of currencies) {
      const rate = await crossBorderEngine.getExchangeRate(base, currency);
      rates[currency] = {
        rate: rate.rate,
        effectiveRate: rate.effectiveRate,
        spread: rate.spread,
      };
    }

    return NextResponse.json({
      success: true,
      requestId,
      base,
      rates,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[CrossBorderAPI] ${requestId} - Error:`, error);

    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
