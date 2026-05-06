/**
 * Cross-Border Routing Engine with FX Optimization
 * 
 * Handles multi-currency transactions with intelligent
 * exchange rate optimization across providers.
 */

import { PrismaClient } from '@prisma/client';
import { MoneyRoutingEngine, RoutingContext, RoutingDecision } from './money-routing-engine';
import { ensureOpenExchangeRatesFresh, getOpenExchangeRatePair } from '@/lib/open-exchange-rates';

const prisma = new PrismaClient();

export interface ExchangeRateQuote {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  inverseRate: number;
  provider?: string;
  source: 'central_bank' | 'provider' | 'market';
  spread: number;
  margin: number;
  effectiveRate: number; // Rate after spread/margin
  validUntil: Date;
}

export interface CrossBorderQuote {
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  fees: {
    fxFee: number;
    providerFee: number;
    totalFees: number;
  };
  recipientGets: number;
  route: CrossBorderRoute;
  alternatives: CrossBorderQuote[];
}

export interface CrossBorderRoute {
  provider: string;
  providerId: string;
  sourceCountry: string;
  destinationCountry: string;
  fxRoute: 'direct' | 'via_usd' | 'via_eur';
  legs: FxLeg[];
}

export interface FxLeg {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  provider?: string;
}

export interface FxOptimizationResult {
  bestRoute: CrossBorderQuote;
  allRoutes: CrossBorderQuote[];
  savings: {
    amount: number;
    percentage: number;
  };
  recommendation: string;
}

export class CrossBorderRoutingEngine {
  private routingEngine: MoneyRoutingEngine;
  private rateCache: Map<string, { rate: ExchangeRateQuote; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.routingEngine = new MoneyRoutingEngine();
  }

  /**
   * Get optimal cross-border payment route
   */
  async findOptimalRoute(context: {
    sourceAmount: number;
    sourceCurrency: string;
    targetCurrency: string;
    sourceCountry?: string;
    destinationCountry: string;
    userId?: string;
  }): Promise<FxOptimizationResult> {
    console.log('[CrossBorderRouting] Finding optimal route:', context);

    // Step 1: Find all possible routes
    const allRoutes = await this.findAllRoutes(context);

    if (allRoutes.length === 0) {
      throw new Error('No available routes for this currency pair');
    }

    // Step 2: Calculate total cost for each route
    const quotes = await this.calculateQuotes(allRoutes, context);

    // Step 3: Sort by best value (highest recipient amount)
    quotes.sort((a, b) => b.recipientGets - a.recipientGets);

    // Step 4: Calculate savings
    const bestRoute = quotes[0];
    const secondBest = quotes[1];
    const savings = secondBest
      ? {
          amount: bestRoute.recipientGets - secondBest.recipientGets,
          percentage: ((bestRoute.recipientGets - secondBest.recipientGets) / secondBest.recipientGets) * 100,
        }
      : { amount: 0, percentage: 0 };

    // Step 5: Generate recommendation
    const recommendation = this.generateRecommendation(bestRoute, savings);

    return {
      bestRoute,
      allRoutes: quotes,
      savings,
      recommendation,
    };
  }

  /**
   * Find all possible routing paths
   */
  private async findAllRoutes(context: {
    sourceCurrency: string;
    targetCurrency: string;
    destinationCountry: string;
  }): Promise<CrossBorderRoute[]> {
    const routes: CrossBorderRoute[] = [];

    // Get providers that support both currencies
    const providers = await prisma.paymentProvider.findMany({
      where: {
        isActive: true,
        supportedCountries: {
          has: context.destinationCountry,
        },
      },
    });

    for (const provider of providers) {
      const supportsSource = provider.supportedCurrencies.includes(context.sourceCurrency);
      const supportsTarget = provider.supportedCurrencies.includes(context.targetCurrency);

      // Direct route - provider supports both currencies
      if (supportsSource && supportsTarget) {
        routes.push({
          provider: provider.name,
          providerId: provider.id,
          sourceCountry: context.destinationCountry,
          destinationCountry: context.destinationCountry,
          fxRoute: 'direct',
          legs: [
            {
              fromCurrency: context.sourceCurrency,
              toCurrency: context.targetCurrency,
              rate: 0, // Will be calculated
              provider: provider.name,
            },
          ],
        });
      }

      // Via USD route
      if (provider.supportedCurrencies.includes('USD')) {
        routes.push({
          provider: provider.name,
          providerId: provider.id,
          sourceCountry: context.destinationCountry,
          destinationCountry: context.destinationCountry,
          fxRoute: 'via_usd',
          legs: [
            {
              fromCurrency: context.sourceCurrency,
              toCurrency: 'USD',
              rate: 0,
            },
            {
              fromCurrency: 'USD',
              toCurrency: context.targetCurrency,
              rate: 0,
            },
          ],
        });
      }

      // Via EUR route
      if (provider.supportedCurrencies.includes('EUR')) {
        routes.push({
          provider: provider.name,
          providerId: provider.id,
          sourceCountry: context.destinationCountry,
          destinationCountry: context.destinationCountry,
          fxRoute: 'via_eur',
          legs: [
            {
              fromCurrency: context.sourceCurrency,
              toCurrency: 'EUR',
              rate: 0,
            },
            {
              fromCurrency: 'EUR',
              toCurrency: context.targetCurrency,
              rate: 0,
            },
          ],
        });
      }
    }

    return routes;
  }

  /**
   * Calculate quotes for all routes
   */
  private async calculateQuotes(
    routes: CrossBorderRoute[],
    context: { sourceAmount: number; sourceCurrency: string; targetCurrency: string }
  ): Promise<CrossBorderQuote[]> {
    const quotes: CrossBorderQuote[] = [];

    for (const route of routes) {
      try {
        const quote = await this.calculateRouteQuote(route, context);
        quotes.push(quote);
      } catch (error) {
        console.error('[CrossBorderRouting] Failed to calculate quote for route:', route, error);
      }
    }

    return quotes;
  }

  /**
   * Calculate quote for a single route
   */
  private async calculateRouteQuote(
    route: CrossBorderRoute,
    context: { sourceAmount: number; sourceCurrency: string; targetCurrency: string }
  ): Promise<CrossBorderQuote> {
    let effectiveRate = 0;
    const legs: FxLeg[] = [];

    // Calculate exchange rate for each leg
    for (const leg of route.legs) {
      const rateQuote = await this.getExchangeRate(leg.fromCurrency, leg.toCurrency, route.providerId);
      legs.push({
        ...leg,
        rate: rateQuote.effectiveRate,
        provider: rateQuote.provider,
      });

      if (effectiveRate === 0) {
        effectiveRate = rateQuote.effectiveRate;
      } else {
        effectiveRate *= rateQuote.effectiveRate;
      }
    }

    // Calculate target amount
    const targetAmount = context.sourceAmount * effectiveRate;

    // Calculate fees
    const provider = await prisma.paymentProvider.findUnique({
      where: { id: route.providerId },
    });

    const providerFee = provider
      ? (context.sourceAmount * (provider.feePercentage / 100)) + (provider.feeFixed || 0)
      : 0;

    const fxFee = targetAmount * 0.01; // 1% FX fee
    const totalFees = providerFee + fxFee;

    const recipientGets = targetAmount - fxFee;

    return {
      sourceAmount: context.sourceAmount,
      sourceCurrency: context.sourceCurrency,
      targetAmount,
      targetCurrency: context.targetCurrency,
      exchangeRate: effectiveRate,
      fees: {
        fxFee,
        providerFee,
        totalFees,
      },
      recipientGets,
      route,
      alternatives: [],
    };
  }

  /**
   * Get exchange rate with caching
   */
  async getExchangeRate(
    baseCurrency: string,
    targetCurrency: string,
    providerId?: string
  ): Promise<ExchangeRateQuote> {
    if (baseCurrency === targetCurrency) {
      return {
        baseCurrency,
        targetCurrency,
        rate: 1,
        inverseRate: 1,
        source: 'market' as any,
        spread: 0,
        margin: 0,
        effectiveRate: 1,
        validUntil: new Date(Date.now() + this.CACHE_TTL),
      };
    }

    const cacheKey = `${baseCurrency}_${targetCurrency}_${providerId || 'market'}`;
    const cached = this.rateCache.get(cacheKey);

    if (cached && Date.now() < cached.expiry) {
      return cached.rate;
    }

    // Try to get from database first
    const dbRate = await prisma.exchangeRate.findFirst({
      where: {
        baseCurrency,
        targetCurrency,
        provider: providerId || null,
        isValid: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (dbRate) {
      const rate: ExchangeRateQuote = {
        baseCurrency,
        targetCurrency,
        rate: dbRate.rate,
        inverseRate: dbRate.inverseRate,
        provider: dbRate.provider || undefined,
        source: dbRate.source as any,
        spread: dbRate.spread,
        margin: dbRate.margin,
        effectiveRate: dbRate.rate * (1 - dbRate.spread - dbRate.margin),
        validUntil: dbRate.validUntil || new Date(Date.now() + this.CACHE_TTL),
      };

      this.rateCache.set(cacheKey, { rate, expiry: Date.now() + this.CACHE_TTL });
      return rate;
    }

    // Fallback: Calculate from market rates (in production, fetch from FX API)
    const marketRate = await this.fetchMarketRate(baseCurrency, targetCurrency);

    const rate: ExchangeRateQuote = {
      baseCurrency,
      targetCurrency,
      rate: marketRate,
      inverseRate: 1 / marketRate,
      source: 'market',
      spread: 0.02, // 2% default spread
      margin: 0.01, // 1% default margin
      effectiveRate: marketRate * 0.97, // After spread and margin
      validUntil: new Date(Date.now() + this.CACHE_TTL),
    };

    this.rateCache.set(cacheKey, { rate, expiry: Date.now() + this.CACHE_TTL });
    return rate;
  }

  /**
   * Fetch market exchange rate (placeholder - integrate with FX API)
   */
  private async fetchMarketRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    const liveRate = await getOpenExchangeRatePair(baseCurrency, targetCurrency);
    if (liveRate) {
      return liveRate.rate;
    }
    throw new Error(`No exchange rate available for ${baseCurrency}/${targetCurrency}`);
  }

  /**
   * Update exchange rates from external API
   */
  async updateExchangeRates(apiKey?: string): Promise<void> {
    console.log('[CrossBorderRouting] Updating exchange rates...');

    const synced = await ensureOpenExchangeRatesFresh([
      'USD',
      'EUR',
      'KES',
      'NGN',
      'GHS',
      'ZAR',
      'TZS',
      'UGX',
      'ZMW',
      'XOF',
      'XAF',
      'MZN',
      'ZWL',
    ]);

    if (!synced) {
      console.warn('[CrossBorderRouting] Open Exchange Rates is not configured, keeping fallback market rates');
    }

    console.log('[CrossBorderRouting] Exchange rates updated');
  }

  /**
   * Generate recommendation based on route analysis
   */
  private generateRecommendation(bestRoute: CrossBorderQuote, savings: { amount: number; percentage: number }): string {
    const parts: string[] = [];

    parts.push(`Best route: ${bestRoute.route.provider} via ${bestRoute.route.fxRoute}`);
    parts.push(`Exchange rate: 1 ${bestRoute.sourceCurrency} = ${bestRoute.exchangeRate.toFixed(4)} ${bestRoute.targetCurrency}`);

    if (savings.percentage > 0) {
      parts.push(`You save ${savings.percentage.toFixed(2)}% (${savings.amount.toFixed(2)} ${bestRoute.targetCurrency}) vs alternative`);
    }

    parts.push(`Total fees: ${bestRoute.fees.totalFees.toFixed(2)} ${bestRoute.targetCurrency}`);
    parts.push(`Recipient gets: ${bestRoute.recipientGets.toFixed(2)} ${bestRoute.targetCurrency}`);

    return parts.join(' | ');
  }

  /**
   * Execute cross-border payment with optimal routing
   */
  async executeCrossBorderPayment(context: {
    sourceAmount: number;
    sourceCurrency: string;
    targetCurrency: string;
    destinationCountry: string;
    phoneNumber: string;
    reference: string;
    description: string;
    userId?: string;
  }): Promise<any> {
    // Find optimal route
    const optimization = await this.findOptimalRoute({
      sourceAmount: context.sourceAmount,
      sourceCurrency: context.sourceCurrency,
      targetCurrency: context.targetCurrency,
      destinationCountry: context.destinationCountry,
      userId: context.userId,
    });

    const bestRoute = optimization.bestRoute;

    // Create routing context
    const routingContext: RoutingContext = {
      amount: context.sourceAmount,
      currency: context.sourceCurrency,
      destinationCountry: context.destinationCountry,
      userId: context.userId,
    };

    // Execute payment through routing engine
    const result = await this.routingEngine.executePayment(
      routingContext,
      {
        phoneNumber: context.phoneNumber,
        amount: context.sourceAmount,
        currency: context.sourceCurrency,
        reference: context.reference,
        description: `${context.description} | ${optimization.recommendation}`,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`,
      },
      {
        preferredProviders: [bestRoute.route.providerId],
      }
    );

    return {
      ...result,
      fxOptimization: optimization,
    };
  }

  /**
   * Clear rate cache
   */
  clearCache(): void {
    this.rateCache.clear();
  }

  /**
   * Get cached rates count
   */
  getCacheSize(): number {
    return this.rateCache.size;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const crossBorderRoutingEngine = new CrossBorderRoutingEngine();

export default CrossBorderRoutingEngine;
