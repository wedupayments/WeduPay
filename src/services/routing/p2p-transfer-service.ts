/**
 * P2P Cross-Border Transfer Service
 * 
 * Enables users to send money across borders directly to mobile wallets.
 * Handles FX conversion, routing, compliance, and recipient management.
 */

import { PrismaClient } from '@prisma/client';
import { CrossBorderRoutingEngine } from './cross-border-routing';
import { MoneyRoutingEngine } from './money-routing-engine';

const prisma = new PrismaClient();
const crossBorderEngine = new CrossBorderRoutingEngine();
const routingEngine = new MoneyRoutingEngine();

// ============================================
// TYPES
// ============================================

export interface P2PTransferRequest {
  userId: string;
  sendAmount: number;
  sendCurrency: string;
  recipientPhone: string;
  recipientCountry: string;
  recipientName?: string;
  recipientWalletType?: string;
  description?: string;
  saveRecipient?: boolean;
}

export interface P2PTransferQuote {
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  exchangeRate: number;
  fees: {
    transferFee: number;
    fxFee: number;
    totalFees: number;
  };
  totalDebit: number;
  estimatedDelivery: string;
  route: {
    provider: string;
    fxRoute: string;
  };
}

export interface TransferLimits {
  dailyMin: number;
  dailyMax: number;
  transactionMin: number;
  transactionMax: number;
  monthlyMax?: number;
  kycRequired: boolean;
}

export interface ComplianceResult {
  passed: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  checks: {
    sanctions: boolean;
    fraud: boolean;
    amountThreshold: boolean;
  };
  requiresReview: boolean;
}

export interface P2PTransferResult {
  success: boolean;
  transferId: string;
  transferRef: string;
  status: string;
  message?: string;
  recipientPhone: string;
  recipientCountry: string;
  receiveAmount: number;
  receiveCurrency: string;
  providerReference?: string;
  estimatedDelivery?: string;
}

// ============================================
// P2P TRANSFER SERVICE
// ============================================

export class P2PTransferService {
  /**
   * Get a quote for a cross-border P2P transfer
   */
  async getTransferQuote(request: P2PTransferRequest): Promise<P2PTransferQuote> {
    // Step 1: Get FX optimization
    const fxOptimization = await crossBorderEngine.findOptimalRoute({
      sourceAmount: request.sendAmount,
      sourceCurrency: request.sendCurrency,
      targetCurrency: this.getCurrencyForCountry(request.recipientCountry),
      destinationCountry: request.recipientCountry,
    });

    const bestRoute = fxOptimization.bestRoute;

    // Step 2: Calculate fees
    const transferFee = this.calculateTransferFee(request.sendAmount, request.sendCurrency);
    const fxFee = bestRoute.fees.fxFee;
    const totalFees = transferFee + fxFee;
    const totalDebit = request.sendAmount + totalFees;

    // Step 3: Check limits
    const limits = await this.getTransferLimits(request.recipientCountry, bestRoute.targetCurrency);
    
    if (totalDebit < limits.transactionMin || totalDebit > limits.transactionMax) {
      throw new Error(`Amount exceeds transfer limits. Min: ${limits.transactionMin}, Max: ${limits.transactionMax}`);
    }

    // Step 4: Estimate delivery time
    const estimatedDelivery = this.estimateDeliveryTime(bestRoute.route.provider);

    return {
      sendAmount: request.sendAmount,
      sendCurrency: request.sendCurrency,
      receiveAmount: bestRoute.recipientGets,
      receiveCurrency: bestRoute.targetCurrency,
      exchangeRate: bestRoute.exchangeRate,
      fees: {
        transferFee,
        fxFee,
        totalFees,
      },
      totalDebit,
      estimatedDelivery,
      route: {
        provider: bestRoute.route.provider,
        fxRoute: bestRoute.route.fxRoute,
      },
    };
  }

  /**
   * Execute a P2P transfer
   */
  async executeTransfer(request: P2PTransferRequest): Promise<P2PTransferResult> {
    const transferRef = `P2P-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Step 1: Get quote
    const quote = await this.getTransferQuote(request);

    // Step 2: Run compliance checks
    const compliance = await this.runComplianceChecks({
      userId: request.userId,
      amount: quote.totalDebit,
      currency: quote.sendCurrency,
      recipientCountry: request.recipientCountry,
      transferRef,
    });

    if (!compliance.passed) {
      throw new Error(`Compliance check failed: ${compliance.riskLevel} risk`);
    }

    // Step 3: Create transfer record
    const transfer = await prisma.p2PTransfer.create({
      data: {
        transferRef,
        userId: request.userId,
        senderPhone: '', // Would get from user profile
        senderCountry: '', // Would get from user profile
        senderWalletType: '',
        recipientPhone: request.recipientPhone,
        recipientName: request.recipientName,
        recipientCountry: request.recipientCountry,
        recipientWalletType: request.recipientWalletType || 'mobile_wallet',
        sendAmount: quote.sendAmount,
        sendCurrency: quote.sendCurrency,
        receiveAmount: quote.receiveAmount,
        receiveCurrency: quote.receiveCurrency,
        exchangeRate: quote.exchangeRate,
        transferFee: quote.fees.transferFee,
        fxFee: quote.fees.fxFee,
        totalFees: quote.fees.totalFees,
        totalDebit: quote.totalDebit,
        routingProvider: quote.route.provider,
        routingProviderId: quote.route.provider,
        status: compliance.requiresReview ? 'PENDING' : 'PROCESSING',
        kycRequired: compliance.riskLevel !== 'LOW',
        complianceCheck: JSON.stringify(compliance),
        description: request.description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Step 4: If compliance requires review, return pending
    if (compliance.requiresReview) {
      return {
        success: false,
        transferId: transfer.id,
        transferRef: transfer.transferRef,
        status: 'PENDING_REVIEW',
        message: 'Transfer requires manual compliance review',
        recipientPhone: request.recipientPhone,
        recipientCountry: request.recipientCountry,
        receiveAmount: quote.receiveAmount,
        receiveCurrency: quote.receiveCurrency,
      };
    }

    try {
      // Step 5: Execute payment through routing engine
      const paymentResult = await routingEngine.executePayment(
        {
          amount: quote.sendAmount,
          currency: quote.sendCurrency,
          destinationCountry: request.recipientCountry,
          userId: request.userId,
          transactionId: transferRef,
        },
        {
          phoneNumber: request.recipientPhone,
          amount: quote.receiveAmount,
          currency: quote.receiveCurrency,
          reference: transferRef,
          description: request.description || `P2P Transfer to ${request.recipientName || request.recipientPhone}`,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/p2p-transfer`,
        },
        {
          preferredProviders: [quote.route.provider],
          maxRetries: 3,
        }
      );

      // Step 6: Update transfer status
      const status = paymentResult.success ? 'COMPLETED' : 'FAILED';
      await prisma.p2PTransfer.update({
        where: { id: transfer.id },
        data: {
          status,
          providerReference: paymentResult.providerReference,
          providerTransactionId: paymentResult.transactionId,
          processedAt: new Date(),
          completedAt: paymentResult.success ? new Date() : null,
          failureReason: paymentResult.success ? null : paymentResult.message,
        },
      });

      // Step 7: Save recipient if requested
      if (request.saveRecipient && paymentResult.success) {
        await this.saveRecipient({
          userId: request.userId,
          name: request.recipientName || 'Saved Recipient',
          phoneNumber: request.recipientPhone,
          country: request.recipientCountry,
          walletType: request.recipientWalletType || 'mobile_wallet',
        });
      }

      return {
        success: paymentResult.success,
        transferId: transfer.id,
        transferRef: transfer.transferRef,
        status,
        message: paymentResult.message,
        recipientPhone: request.recipientPhone,
        recipientCountry: request.recipientCountry,
        receiveAmount: quote.receiveAmount,
        receiveCurrency: quote.receiveCurrency,
        providerReference: paymentResult.providerReference,
        estimatedDelivery: quote.estimatedDelivery,
      };

    } catch (error) {
      // Step 8: Handle failure
      await prisma.p2PTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'FAILED',
          failureReason: (error as Error).message,
        },
      });

      return {
        success: false,
        transferId: transfer.id,
        transferRef: transfer.transferRef,
        status: 'FAILED',
        message: (error as Error).message,
        recipientPhone: request.recipientPhone,
        recipientCountry: request.recipientCountry,
        receiveAmount: quote.receiveAmount,
        receiveCurrency: quote.receiveCurrency,
      };
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferRef: string): Promise<any> {
    const transfer = await prisma.p2PTransfer.findUnique({
      where: { transferRef },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    return {
      transferRef: transfer.transferRef,
      status: transfer.status,
      sendAmount: transfer.sendAmount,
      sendCurrency: transfer.sendCurrency,
      receiveAmount: transfer.receiveAmount,
      receiveCurrency: transfer.receiveCurrency,
      exchangeRate: transfer.exchangeRate,
      recipientPhone: transfer.recipientPhone,
      recipientCountry: transfer.recipientCountry,
      recipientName: transfer.recipientName,
      providerReference: transfer.providerReference,
      createdAt: transfer.createdAt,
      completedAt: transfer.completedAt,
      failureReason: transfer.failureReason,
    };
  }

  /**
   * Get user's transfer history
   */
  async getTransferHistory(userId: string, options?: { page?: number; limit?: number; status?: string }): Promise<any> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.status) {
      where.status = options.status;
    }

    const [transfers, total] = await Promise.all([
      prisma.p2PTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          transferRef: true,
          status: true,
          sendAmount: true,
          sendCurrency: true,
          receiveAmount: true,
          receiveCurrency: true,
          recipientPhone: true,
          recipientName: true,
          recipientCountry: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.p2PTransfer.count({ where }),
    ]);

    return {
      transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Save a recipient for future transfers
   */
  async saveRecipient(data: {
    userId: string;
    name: string;
    phoneNumber: string;
    country: string;
    walletType: string;
  }): Promise<any> {
    // Check if recipient already exists
    const existing = await prisma.transferRecipient.findFirst({
      where: {
        userId: data.userId,
        phoneNumber: data.phoneNumber,
        country: data.country,
      },
    });

    if (existing) {
      return prisma.transferRecipient.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          walletType: data.walletType,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return prisma.transferRecipient.create({
      data,
    });
  }

  /**
   * Get user's saved recipients
   */
  async getRecipients(userId: string): Promise<any> {
    return prisma.transferRecipient.findMany({
      where: { userId },
      orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Delete a saved recipient
   */
  async deleteRecipient(userId: string, recipientId: string): Promise<void> {
    await prisma.transferRecipient.deleteMany({
      where: {
        id: recipientId,
        userId,
      },
    });
  }

  /**
   * Get transfer limits for a country
   */
  async getTransferLimits(country: string, currency: string, walletType: string = 'mobile_wallet'): Promise<TransferLimits> {
    const limit = await prisma.transferLimit.findFirst({
      where: {
        country,
        currency,
        walletType,
        isActive: true,
      },
    });

    if (!limit) {
      // Return default limits
      return {
        dailyMin: 1,
        dailyMax: 10000,
        transactionMin: 1,
        transactionMax: 5000,
        monthlyMax: 50000,
        kycRequired: false,
      };
    }

    return {
      dailyMin: limit.dailyMin,
      dailyMax: limit.dailyMax,
      transactionMin: limit.transactionMin,
      transactionMax: limit.transactionMax,
      monthlyMax: limit.monthlyMax || undefined,
      kycRequired: limit.kycRequired,
    };
  }

  /**
   * Run compliance checks
   */
  private async runComplianceChecks(data: {
    userId: string;
    amount: number;
    currency: string;
    recipientCountry: string;
    transferRef: string;
  }): Promise<ComplianceResult> {
    const checks = {
      sanctions: true, // Would integrate with sanctions API
      fraud: true, // Would check fraud database
      amountThreshold: data.amount < 10000, // Simple threshold check
    };

    // Calculate risk score (0-100)
    let riskScore = 0;

    // Amount-based risk
    if (data.amount > 5000) riskScore += 20;
    if (data.amount > 10000) riskScore += 30;

    // Country-based risk (simplified)
    const highRiskCountries = ['XX', 'YY']; // Placeholder
    if (highRiskCountries.includes(data.recipientCountry)) {
      riskScore += 40;
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';

    const passed = checks.sanctions && checks.fraud && checks.amountThreshold;
    const requiresReview = riskLevel === 'HIGH' || !passed;

    // Log compliance check
    await prisma.complianceCheck.create({
      data: {
        transferId: data.transferRef,
        userId: data.userId,
        checkType: 'p2p_transfer',
        status: passed ? 'PASS' : 'FAIL',
        riskScore,
        riskLevel,
        details: JSON.stringify({ checks, amount: data.amount, country: data.recipientCountry }),
        action: requiresReview ? 'manual_review' : 'approved',
      },
    });

    return {
      passed,
      riskLevel,
      riskScore,
      checks,
      requiresReview,
    };
  }

  /**
   * Calculate transfer fee
   */
  private calculateTransferFee(amount: number, currency: string): number {
    // Tiered fee structure
    let feePercentage = 0.02; // 2% default
    
    if (amount > 1000) feePercentage = 0.015;
    if (amount > 5000) feePercentage = 0.01;
    if (amount > 10000) feePercentage = 0.005;

    const fee = amount * feePercentage;
    const minFee = 1; // Minimum fee
    const maxFee = 500; // Maximum fee

    return Math.max(minFee, Math.min(fee, maxFee));
  }

  /**
   * Get currency for country
   */
  private getCurrencyForCountry(country: string): string {
    const currencyMap: Record<string, string> = {
      KE: 'KES',
      TZ: 'TZS',
      UG: 'UGX',
      NG: 'NGN',
      GH: 'GHS',
      SN: 'XOF',
      CI: 'XOF',
      ML: 'XOF',
      BF: 'XOF',
      ZW: 'USD',
      ZM: 'ZMW',
      MZ: 'MZN',
      CM: 'XAF',
      ZA: 'ZAR',
      RW: 'RWF',
      BJ: 'XOF',
      TG: 'XOF',
      NE: 'XOF',
      GA: 'XAF',
    };

    return currencyMap[country] || 'USD';
  }

  /**
   * Estimate delivery time
   */
  private estimateDeliveryTime(provider: string): string {
    // Most mobile money transfers are instant or near-instant
    const instantProviders = ['mpesa', 'airtel', 'mtn', 'ecocash', 'paystack', 'flutterwave'];
    
    if (instantProviders.includes(provider.toLowerCase())) {
      return 'Instant';
    }

    return 'Within 24 hours';
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const p2PTransferService = new P2PTransferService();

export default P2PTransferService;
