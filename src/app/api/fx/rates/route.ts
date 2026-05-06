/**
 * FX Rates API
 * 
 * Get current exchange rates for currency conversion
 * 
 * @endpoint GET /api/fx/rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureOpenExchangeRatesFresh, getOpenExchangeRatePair } from '@/lib/open-exchange-rates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    await ensureOpenExchangeRatesFresh([from || "", to || ""]);

    // If specific currencies requested
    if (from && to) {
      const rate = await prisma.exchangeRate.findFirst({
        where: {
          baseCurrency: from.toUpperCase(),
          targetCurrency: to.toUpperCase(),
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
        const livePair = await getOpenExchangeRatePair(from, to);

        if (!livePair) {
          return NextResponse.json(
            {
              success: false,
              error: `Exchange rate not found for ${from}/${to}`,
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          rate: {
            from: livePair.baseCurrency,
            to: livePair.targetCurrency,
            rate: livePair.rate,
            inverseRate: livePair.inverseRate,
            source: livePair.source,
            provider: livePair.provider,
            updatedAt: livePair.timestamp,
          },
        });
      }

      return NextResponse.json({
        success: true,
        rate: {
          from: rate.baseCurrency,
          to: rate.targetCurrency,
          rate: rate.rate,
          inverseRate: rate.inverseRate,
          source: rate.source,
          provider: rate.provider,
          updatedAt: rate.updatedAt,
        },
      });
    }

    // Get all active rates
    const rates = await prisma.exchangeRate.findMany({
      where: {
        isValid: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by currency pair
    const rateMap = new Map();
    rates.forEach((rate) => {
      const key = `${rate.baseCurrency}/${rate.targetCurrency}`;
      if (!rateMap.has(key)) {
        rateMap.set(key, {
          from: rate.baseCurrency,
          to: rate.targetCurrency,
          rate: rate.rate,
          inverseRate: rate.inverseRate,
          source: rate.source,
          provider: rate.provider,
          updatedAt: rate.updatedAt,
        });
      }
    });

    return NextResponse.json({
      success: true,
      rates: Array.from(rateMap.values()),
      count: rateMap.size,
    });
  } catch (error) {
    console.error('[FX Rates API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exchange rates',
      },
      { status: 500 }
    );
  }
}
