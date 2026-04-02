/**
 * Money Routing Network - Core Engine
 * 
 * Intelligent payment routing across multiple African mobile money providers.
 * Optimizes for success rate, cost, speed, and availability.
 */

import { PrismaClient } from '@prisma/client';
import {
  AfricanWalletFactory,
  WalletType,
  UnifiedWalletAdapter,
  UnifiedPaymentRequest,
  UnifiedPaymentResponse,
} from '@/services/wallets/unified-wallet-factory';

const prisma = new PrismaClient();

// ============================================
// TYPES & INTERFACES
// ============================================

export enum RoutingStrategy {
  BEST_RATE = 'best_rate',
  FASTEST = 'fastest',
  CHEAPEST = 'cheapest',
  PRIMARY_FIRST = 'primary_first',
  ROUND_ROBIN = 'round_robin',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  SUCCESS_RATE_OPTIMIZED = 'success_rate_optimized',
}

export enum ProviderStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  UNKNOWN = 'UNKNOWN',
}

export interface RoutingDecision {
  selectedProvider: string;
  selectedProviderId: string;
  reason: string;
  score: number;
  alternatives: ProviderScore[];
  estimatedFee: number;
  estimatedTime: number;
  successProbability: number;
}

export interface ProviderScore {
  providerId: string;
  providerName: string;
  score: number;
  factors: ProviderScoringFactors;
}

export interface ProviderScoringFactors {
  successRateScore: number;
  costScore: number;
  speedScore: number;
  availabilityScore: number;
  priorityScore: number;
}

export interface RoutingOptions {
  strategy?: RoutingStrategy;
  maxRetries?: number;
  preferredProviders?: string[];
  excludedProviders?: string[];
  maxAmount?: number;
  requireInstantConfirmation?: boolean;
}

export interface RoutingContext {
  amount: number;
  currency: string;
  sourceCountry?: string;
  destinationCountry: string;
  providerType?: WalletType;
  userId?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export interface FeeQuote {
  providerId: string;
  providerName: string;
  feeType: 'percentage' | 'fixed' | 'tiered';
  feeAmount: number;
  feePercentage: number;
  totalAmount: number;
  currency: string;
}

export interface RoutingResult {
  success: boolean;
  transactionId: string;
  routedTransactionId: string;
  provider: string;
  providerReference?: string;
  status: string;
  message?: string;
  attempts: number;
  routingHistory: RoutingDecision[];
}

// ============================================
// ROUTING ENGINE
// ============================================

export class MoneyRoutingEngine {
  private providerCache: Map<string, any> = new Map();
  private healthCache: Map<string, ProviderStatus> = new Map();
  private lastHealthCheck: Map<string, number> = new Map();
  private readonly HEALTH_CHECK_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Route a payment through the optimal provider
   */
  async routePayment(context: RoutingContext, options: RoutingOptions = {}): Promise<RoutingDecision> {
    console.log('[RoutingEngine] Routing payment:', context);

    // Step 1: Get eligible providers for this transaction
    const eligibleProviders = await this.getEligibleProviders(context);
    console.log('[RoutingEngine] Eligible providers:', eligibleProviders.map(p => p.name));

    if (eligibleProviders.length === 0) {
      throw new Error('No eligible providers found for this transaction');
    }

    // Step 2: Score each provider based on strategy
    const scoredProviders = await this.scoreProviders(eligibleProviders, context, options);

    // Step 3: Select best provider
    const selectedProvider = this.selectProvider(scoredProviders, options);

    // Step 4: Calculate routing metrics
    const routingDecision = await this.createRoutingDecision(
      selectedProvider,
      scoredProviders,
      context,
      options
    );

    // Step 5: Log routing decision
    await this.logRoutingDecision(context, routingDecision);

    return routingDecision;
  }

  /**
   * Execute payment with automatic retry and fallback
   */
  async executePayment(
    context: RoutingContext,
    paymentRequest: UnifiedPaymentRequest,
    options: RoutingOptions = {}
  ): Promise<RoutingResult> {
    const transactionId = context.transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const maxAttempts = options.maxRetries || 3;
    const routingHistory: RoutingDecision[] = [];
    let attempt = 0;
    let lastError: Error | null = null;
    let routedTransactionId: string | null = null;

    while (attempt < maxAttempts) {
      try {
        // Get routing decision for this attempt
        const routingDecision = await this.routePayment(
          { ...context, transactionId },
          {
            ...options,
            excludedProviders: attempt > 0 ? this.getPreviousProviders(routingHistory) : options.excludedProviders,
          }
        );

        routingHistory.push(routingDecision);

        // Create routed transaction record
        const routedTx = await this.createRoutedTransaction({
          transactionId,
          userId: context.userId || 'anonymous',
          selectedProvider: routingDecision.selectedProvider,
          selectedProviderId: routingDecision.selectedProviderId,
          routingRuleId: null,
          routingReason: routingDecision.reason,
          attemptNumber: attempt + 1,
          maxAttempts,
          previousProviders: this.getPreviousProviders(routingHistory),
          amount: context.amount,
          currency: context.currency,
          destinationCountry: context.destinationCountry,
        });

        routedTransactionId = routedTx.id;

        // Initialize wallet adapter
        const wallet = AfricanWalletFactory.createWallet({
          type: routingDecision.selectedProvider as WalletType,
          country: context.destinationCountry,
          environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
        });

        // Execute payment
        const result = await wallet.initiatePayment(paymentRequest);

        // Update routed transaction
        await this.updateRoutedTransaction(routedTransactionId, {
          status: result.success ? 'PROCESSING' : 'FAILED',
          providerResponse: JSON.stringify(result),
          providerReference: result.providerReference,
          providerTransactionId: result.transactionId,
          errorCode: result.success ? null : 'PAYMENT_FAILED',
          errorMessage: result.message,
          willRetry: !result.success && attempt < maxAttempts - 1,
        });

        if (result.success) {
          return {
            success: true,
            transactionId,
            routedTransactionId: routedTransactionId!,
            provider: routingDecision.selectedProvider,
            providerReference: result.providerReference,
            status: result.status,
            message: result.message,
            attempts: attempt + 1,
            routingHistory,
          };
        }

        lastError = new Error(result.message || 'Payment failed');
        attempt++;

      } catch (error) {
        console.error(`[RoutingEngine] Attempt ${attempt + 1} failed:`, error);
        lastError = error as Error;
        attempt++;

        // Update routed transaction if exists
        if (routedTransactionId) {
          await this.updateRoutedTransaction(routedTransactionId, {
            status: 'FAILED',
            errorCode: 'ROUTING_ERROR',
            errorMessage: (error as Error).message,
            willRetry: attempt < maxAttempts,
          });
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      transactionId,
      routedTransactionId: routedTransactionId || '',
      provider: routingHistory[routingHistory.length - 1]?.selectedProvider || 'UNKNOWN',
      status: 'FAILED',
      message: `Payment failed after ${attempt} attempts: ${lastError?.message}`,
      attempts: attempt,
      routingHistory,
    };
  }

  /**
   * Get eligible providers for a transaction
   */
  private async getEligibleProviders(context: RoutingContext): Promise<any[]> {
    const now = new Date();

    // Query providers that support this country and currency
    const providers = await prisma.paymentProvider.findMany({
      where: {
        isActive: true,
        supportedCountries: {
          has: context.destinationCountry,
        },
        OR: [
          { supportedCurrencies: { has: context.currency } },
          { supportedCurrencies: { has: 'USD' } },
          { supportedCurrencies: { has: 'EUR' } },
        ],
        minTransactionAmount: {
          lte: context.amount,
        },
        maxTransactionAmount: {
          gte: context.amount,
        },
      },
      orderBy: {
        priority: 'asc',
      },
    });

    // Filter by health status
    const healthyProviders: any[] = [];
    for (const provider of providers) {
      const status = await this.getProviderHealth(provider.id);
      if (status !== ProviderStatus.UNHEALTHY) {
        healthyProviders.push({ ...provider, healthStatus: status });
      }
    }

    return healthyProviders;
  }

  /**
   * Score providers based on multiple factors
   */
  private async scoreProviders(
    providers: any[],
    context: RoutingContext,
    options: RoutingOptions
  ): Promise<ProviderScore[]> {
    const scored: ProviderScore[] = [];

    for (const provider of providers) {
      const factors = await this.calculateProviderScores(provider, context, options);
      const totalScore = this.calculateTotalScore(factors, options.strategy);

      scored.push({
        providerId: provider.id,
        providerName: provider.name,
        score: totalScore,
        factors,
      });
    }

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate individual scoring factors for a provider
   */
  private async calculateProviderScores(
    provider: any,
    context: RoutingContext,
    options: RoutingOptions
  ): Promise<ProviderScoringFactors> {
    // Success rate score (0-25)
    const successRateScore = (provider.successRate / 100) * 25;

    // Cost score (0-25) - lower fees = higher score
    const fee = this.calculateFee(provider, context.amount);
    const maxFee = context.amount * 0.1; // Assume 10% is max acceptable
    const costScore = Math.max(0, (1 - fee / maxFee) * 25);

    // Speed score (0-25) - faster response = higher score
    const avgResponseTime = provider.avgResponseTime || 5000;
    const maxResponseTime = 30000; // 30 seconds
    const speedScore = Math.max(0, (1 - avgResponseTime / maxResponseTime) * 25);

    // Availability score (0-25)
    const healthStatus = await this.getProviderHealth(provider.id);
    const availabilityScore = healthStatus === ProviderStatus.HEALTHY ? 25 :
                              healthStatus === ProviderStatus.DEGRADED ? 15 : 0;

    // Priority score (bonus 0-25)
    const priorityScore = Math.max(0, (10 - provider.priority) * 2.5);

    return {
      successRateScore,
      costScore,
      speedScore,
      availabilityScore,
      priorityScore,
    };
  }

  /**
   * Calculate total score based on strategy
   */
  private calculateTotalScore(factors: ProviderScoringFactors, strategy?: RoutingStrategy): number {
    switch (strategy) {
      case RoutingStrategy.CHEAPEST:
        return factors.costScore * 0.6 + factors.successRateScore * 0.2 + factors.availabilityScore * 0.2;
      case RoutingStrategy.FASTEST:
        return factors.speedScore * 0.6 + factors.successRateScore * 0.2 + factors.availabilityScore * 0.2;
      case RoutingStrategy.SUCCESS_RATE_OPTIMIZED:
        return factors.successRateScore * 0.5 + factors.availabilityScore * 0.3 + factors.costScore * 0.2;
      case RoutingStrategy.PRIMARY_FIRST:
        return factors.priorityScore * 0.5 + factors.successRateScore * 0.3 + factors.costScore * 0.2;
      default: // BEST_RATE - balanced
        return (
          factors.successRateScore * 0.3 +
          factors.costScore * 0.25 +
          factors.speedScore * 0.2 +
          factors.availabilityScore * 0.15 +
          factors.priorityScore * 0.1
        );
    }
  }

  /**
   * Select best provider from scored list
   */
  private selectProvider(scoredProviders: ProviderScore[], options: RoutingOptions): ProviderScore {
    // Filter out excluded providers
    let filtered = scoredProviders;
    if (options.excludedProviders?.length) {
      filtered = scoredProviders.filter(
        p => !options.excludedProviders!.includes(p.providerId)
      );
    }

    // Filter for preferred providers if specified
    if (options.preferredProviders?.length && filtered.length > 0) {
      const preferred = filtered.filter(
        p => options.preferredProviders!.includes(p.providerId)
      );
      if (preferred.length > 0) {
        filtered = preferred;
      }
    }

    if (filtered.length === 0) {
      throw new Error('No providers available after filtering');
    }

    return filtered[0];
  }

  /**
   * Create routing decision object
   */
  private async createRoutingDecision(
    selected: ProviderScore,
    allScored: ProviderScore[],
    context: RoutingContext,
    options: RoutingOptions
  ): Promise<RoutingDecision> {
    const fee = this.calculateFeeForProvider(selected.providerId, context.amount, context.currency);
    const estimatedTime = await this.getEstimatedResponseTime(selected.providerId);
    const successProbability = await this.getSuccessProbability(selected.providerId);

    return {
      selectedProvider: selected.providerName,
      selectedProviderId: selected.providerId,
      reason: this.generateRoutingReason(selected, options.strategy),
      score: selected.score,
      alternatives: allScored.slice(1, 4), // Top 3 alternatives
      estimatedFee: fee.feeAmount,
      estimatedTime,
      successProbability,
    };
  }

  /**
   * Calculate fee for a provider
   */
  private calculateFee(provider: any, amount: number): number {
    if (provider.feeType === 'fixed') {
      return provider.feeFixed;
    }

    const percentageFee = amount * (provider.feePercentage / 100);
    const fee = Math.max(provider.feeMinimum, percentageFee);

    if (provider.feeMaximum) {
      return Math.min(fee, provider.feeMaximum);
    }

    return fee;
  }

  /**
   * Calculate fee quote for a specific provider
   */
  private calculateFeeForProvider(
    providerId: string,
    amount: number,
    currency: string
  ): FeeQuote {
    // This would normally fetch from database
    // Simplified for now
    return {
      providerId,
      providerName: providerId,
      feeType: 'percentage',
      feeAmount: amount * 0.02, // 2% default
      feePercentage: 2,
      totalAmount: amount * 1.02,
      currency,
    };
  }

  /**
   * Get provider health status with caching
   */
  private async getProviderHealth(providerId: string): Promise<ProviderStatus> {
    const cached = this.healthCache.get(providerId);
    const lastCheck = this.lastHealthCheck.get(providerId);
    const now = Date.now();

    if (cached && lastCheck && (now - lastCheck) < this.HEALTH_CHECK_TTL) {
      return cached;
    }

    // Get latest health check from database
    const latestCheck = await prisma.providerHealthCheck.findFirst({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });

    const status = latestCheck
      ? (latestCheck.status as ProviderStatus)
      : ProviderStatus.UNKNOWN;

    this.healthCache.set(providerId, status);
    this.lastHealthCheck.set(providerId, now);

    return status;
  }

  /**
   * Get estimated response time for provider
   */
  private async getEstimatedResponseTime(providerId: string): Promise<number> {
    const provider = await prisma.paymentProvider.findUnique({
      where: { id: providerId },
      select: { avgResponseTime: true },
    });
    return provider?.avgResponseTime || 5000;
  }

  /**
   * Get success probability for provider
   */
  private async getSuccessProbability(providerId: string): Promise<number> {
    const provider = await prisma.paymentProvider.findUnique({
      where: { id: providerId },
      select: { successRate: true },
    });
    return provider?.successRate || 100;
  }

  /**
   * Generate human-readable routing reason
   */
  private generateRoutingReason(selected: ProviderScore, strategy?: RoutingStrategy): string {
    const factors = selected.factors;
    const bestFactor = Object.entries(factors)
      .sort(([, a], [, b]) => b - a)[0][0];

    const factorNames: Record<string, string> = {
      successRateScore: 'highest success rate',
      costScore: 'lowest fees',
      speedScore: 'fastest processing',
      availabilityScore: 'best availability',
      priorityScore: 'primary provider',
    };

    switch (strategy) {
      case RoutingStrategy.CHEAPEST:
        return 'Selected for lowest transaction fees';
      case RoutingStrategy.FASTEST:
        return 'Selected for fastest processing time';
      case RoutingStrategy.SUCCESS_RATE_OPTIMIZED:
        return 'Selected for highest success probability';
      case RoutingStrategy.PRIMARY_FIRST:
        return 'Selected as primary provider';
      default:
        return `Selected for ${factorNames[bestFactor] || 'optimal balance'}`;
    }
  }

  /**
   * Create routed transaction record
   */
  private async createRoutedTransaction(data: {
    transactionId: string;
    userId: string;
    selectedProvider: string;
    selectedProviderId: string;
    routingRuleId: string | null;
    routingReason: string;
    attemptNumber: number;
    maxAttempts: number;
    previousProviders: string[];
    amount: number;
    currency: string;
    destinationCountry: string;
  }) {
    return prisma.routedTransaction.create({
      data,
    });
  }

  /**
   * Update routed transaction
   */
  private async updateRoutedTransaction(id: string, data: Partial<any>) {
    return prisma.routedTransaction.update({
      where: { id },
      data,
    });
  }

  /**
   * Log routing decision for analytics
   */
  private async logRoutingDecision(context: RoutingContext, decision: RoutingDecision) {
    // Could log to separate analytics table
    console.log('[RoutingEngine] Decision logged:', {
      timestamp: new Date().toISOString(),
      context,
      decision,
    });
  }

  /**
   * Get previous providers from routing history
   */
  private getPreviousProviders(history: RoutingDecision[]): string[] {
    return history.map(h => h.selectedProviderId);
  }

  /**
   * Refresh provider health status
   */
  async refreshProviderHealth(providerId: string): Promise<ProviderStatus> {
    const startTime = Date.now();

    try {
      // Try to ping provider API
      const wallet = AfricanWalletFactory.createWallet({
        type: providerId as WalletType,
        environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
      });

      // Simple validation test
      const isValid = wallet.validatePhoneNumber('254700000000');

      const responseTime = Date.now() - startTime;

      const healthCheck = await prisma.providerHealthCheck.create({
        data: {
          providerId,
          status: isValid ? ProviderStatus.HEALTHY : ProviderStatus.DEGRADED,
          isReachable: true,
          responseTime,
          checkType: 'ping',
        },
      });

      // Update cache
      const status = isValid ? ProviderStatus.HEALTHY : ProviderStatus.DEGRADED;
      this.healthCache.set(providerId, status);
      this.lastHealthCheck.set(providerId, Date.now());

      // Update provider metrics
      await prisma.paymentProvider.update({
        where: { id: providerId },
        data: {
          lastHealthCheck: new Date(),
          avgResponseTime: responseTime,
        },
      });

      return status;
    } catch (error) {
      await prisma.providerHealthCheck.create({
        data: {
          providerId,
          status: ProviderStatus.UNHEALTHY,
          isReachable: false,
          responseTime: 0,
          checkType: 'ping',
          testErrorMessage: (error as Error).message,
        },
      });

      this.healthCache.set(providerId, ProviderStatus.UNHEALTHY);
      this.lastHealthCheck.set(providerId, Date.now());

      return ProviderStatus.UNHEALTHY;
    }
  }

  /**
   * Get fee quotes for all providers
   */
  async getFeeQuotes(context: RoutingContext): Promise<FeeQuote[]> {
    const providers = await this.getEligibleProviders(context);

    return providers.map(provider => ({
      providerId: provider.id,
      providerName: provider.displayName || provider.name,
      feeType: provider.feeType as 'percentage' | 'fixed' | 'tiered',
      feeAmount: this.calculateFee(provider, context.amount),
      feePercentage: provider.feePercentage,
      totalAmount: context.amount + this.calculateFee(provider, context.amount),
      currency: context.currency,
    }));
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const moneyRoutingEngine = new MoneyRoutingEngine();

export default MoneyRoutingEngine;
