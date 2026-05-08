/**
 * FX Convert API
 * 
 * Convert amount from one currency to another
 * 
 * @endpoint GET /api/fx/convert?from=USD&to=ZWL&amount=100
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureOpenExchangeRatesFresh, getOpenExchangeRatePair } from '@/lib/open-exchange-rates';
import { authenticateRequest, requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amountStr = searchParams.get('amount');

    if (!from || !to || !amountStr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: from, to, amount',
        },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount',
        },
        { status: 400 }
      );
    }

    const fromCurrency = from.toUpperCase();
    const toCurrency = to.toUpperCase();

    await ensureOpenExchangeRatesFresh([fromCurrency, toCurrency]);

    // Same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return NextResponse.json({
        success: true,
        conversion: {
          from: fromCurrency,
          to: toCurrency,
          amount,
          convertedAmount: amount,
          rate: 1,
          fee: 0,
          totalAmount: amount,
        },
      });
    }

    // Get exchange rate
    const rate = await prisma.exchangeRate.findFirst({
      where: {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        isValid: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (!rate) {
      const livePair = await getOpenExchangeRatePair(fromCurrency, toCurrency);

      if (!livePair) {
        return NextResponse.json(
          {
            success: false,
            error: `Exchange rate not available for ${fromCurrency}/${toCurrency}`,
          },
          { status: 404 }
        );
      }

      const convertedAmount = amount * livePair.rate;
      const fee = convertedAmount * 0.015;
      const totalAmount = convertedAmount + fee;

      return NextResponse.json({
        success: true,
        conversion: {
          from: fromCurrency,
          to: toCurrency,
          amount,
          convertedAmount: parseFloat(convertedAmount.toFixed(2)),
          rate: livePair.rate,
          fee: parseFloat(fee.toFixed(2)),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          source: livePair.source,
          provider: livePair.provider,
          updatedAt: livePair.timestamp,
        },
      });
    }

    // Calculate conversion
    const convertedAmount = amount * rate.rate;
    const fee = convertedAmount * (rate.spread + rate.margin);
    const totalAmount = convertedAmount + fee;

    return NextResponse.json({
      success: true,
      conversion: {
        from: fromCurrency,
        to: toCurrency,
        amount,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        rate: rate.rate,
        fee: parseFloat(fee.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        source: rate.source,
        provider: rate.provider,
        updatedAt: rate.updatedAt,
      },
    });
  } catch (error) {
    console.error('[FX Convert API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to convert currency',
      },
      { status: 500 }
    );
  }
}
