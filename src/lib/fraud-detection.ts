/**
 * Fraud Detection Engine
 *
 * Analyzes transactions and user behavior to detect suspicious activity.
 * Flags transactions that violate risk rules and generates compliance alerts.
 *
 * @module lib/fraud-detection
 */

import { prisma } from "@/lib/prisma";

export interface TransactionContext {
  userId: string;
  amount: number;
  currency: string;
  destinationCountry: string;
  destinationProvider?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  transactionCount24h: number;
  totalVolume24h: number;
  isFirstTransaction: boolean;
}

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  passed: boolean;
  flags: FraudFlag[];
  recommendedAction: "allow" | "review" | "block" | "hold";
}

export interface FraudFlag {
  rule: string;
  severity: "info" | "warning" | "critical";
  message: string;
  score: number;
}

// Threshold configuration
const FRAUD_RULES = {
  // Large transaction: > $5,000 single transaction
  largeTransaction: {
    threshold: 5000,
    criticalThreshold: 25000,
    score: 20,
    criticalScore: 50,
  },

  // High frequency: > 10 transactions in 24 hours
  highFrequency: {
    threshold: 10,
    criticalThreshold: 50,
    score: 15,
    criticalScore: 40,
  },

  // High volume: > $10,000 in 24 hours
  highVolume: {
    threshold: 10000,
    criticalThreshold: 50000,
    score: 20,
    criticalScore: 50,
  },

  // New account: first transaction within 24 hours of signup
  newAccount: {
    score: 10,
  },

  // High-risk countries (FATF grey list examples)
  highRiskCountries: [
    "MM", // Myanmar
    "NI", // Nicaragua
    "PA", // Panama
    "PH", // Philippines
    "SY", // Syria
    "YE", // Yemen
    "ZM", // Zambia
    "ZW", // Zimbabwe
  ],

  // Unusual location: different country from user's registered country
  unusualLocation: {
    score: 25,
  },
};

function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function getRecommendedAction(riskLevel: string): "allow" | "review" | "block" | "hold" {
  switch (riskLevel) {
    case "critical":
      return "block";
    case "high":
      return "hold";
    case "medium":
      return "review";
    default:
      return "allow";
  }
}

/**
 * Run fraud checks against a transaction
 *
 * Evaluates the transaction against all configured risk rules.
 * Returns a risk score, flags, and recommended action.
 *
 * @param ctx - Transaction context with user and transaction data
 * @returns FraudCheckResult with score, flags, and action
 *
 * @example
 * ```typescript
 * const result = await runFraudChecks({
 *   userId: "user-123",
 *   amount: 7500,
 *   currency: "USD",
 *   destinationCountry: "KE",
 *   transactionCount24h: 3,
 *   totalVolume24h: 12000,
 *   isFirstTransaction: false,
 * });
 *
 * if (!result.passed) {
 *   // Block or hold the transaction
 * }
 * ```
 */
export async function runFraudChecks(ctx: TransactionContext): Promise<FraudCheckResult> {
  const flags: FraudFlag[] = [];
  let totalScore = 0;

  // Rule 1: Large transaction amount
  if (ctx.amount > FRAUD_RULES.largeTransaction.criticalThreshold) {
    flags.push({
      rule: "LARGE_TRANSACTION_CRITICAL",
      severity: "critical",
      message: `Transaction amount $${ctx.amount} exceeds critical threshold ($${FRAUD_RULES.largeTransaction.criticalThreshold})`,
      score: FRAUD_RULES.largeTransaction.criticalScore,
    });
    totalScore += FRAUD_RULES.largeTransaction.criticalScore;
  } else if (ctx.amount > FRAUD_RULES.largeTransaction.threshold) {
    flags.push({
      rule: "LARGE_TRANSACTION",
      severity: "warning",
      message: `Transaction amount $${ctx.amount} exceeds standard threshold ($${FRAUD_RULES.largeTransaction.threshold})`,
      score: FRAUD_RULES.largeTransaction.score,
    });
    totalScore += FRAUD_RULES.largeTransaction.score;
  }

  // Rule 2: High transaction frequency
  if (ctx.transactionCount24h > FRAUD_RULES.highFrequency.criticalThreshold) {
    flags.push({
      rule: "HIGH_FREQUENCY_CRITICAL",
      severity: "critical",
      message: `${ctx.transactionCount24h} transactions in 24h exceeds critical limit (${FRAUD_RULES.highFrequency.criticalThreshold})`,
      score: FRAUD_RULES.highFrequency.criticalScore,
    });
    totalScore += FRAUD_RULES.highFrequency.criticalScore;
  } else if (ctx.transactionCount24h > FRAUD_RULES.highFrequency.threshold) {
    flags.push({
      rule: "HIGH_FREQUENCY",
      severity: "warning",
      message: `${ctx.transactionCount24h} transactions in 24h exceeds standard limit (${FRAUD_RULES.highFrequency.threshold})`,
      score: FRAUD_RULES.highFrequency.score,
    });
    totalScore += FRAUD_RULES.highFrequency.score;
  }

  // Rule 3: High volume in 24 hours
  if (ctx.totalVolume24h > FRAUD_RULES.highVolume.criticalThreshold) {
    flags.push({
      rule: "HIGH_VOLUME_CRITICAL",
      severity: "critical",
      message: `24h volume $${ctx.totalVolume24h} exceeds critical threshold ($${FRAUD_RULES.highVolume.criticalThreshold})`,
      score: FRAUD_RULES.highVolume.criticalScore,
    });
    totalScore += FRAUD_RULES.highVolume.criticalScore;
  } else if (ctx.totalVolume24h > FRAUD_RULES.highVolume.threshold) {
    flags.push({
      rule: "HIGH_VOLUME",
      severity: "warning",
      message: `24h volume $${ctx.totalVolume24h} exceeds standard threshold ($${FRAUD_RULES.highVolume.threshold})`,
      score: FRAUD_RULES.highVolume.score,
    });
    totalScore += FRAUD_RULES.highVolume.score;
  }

  // Rule 4: New account first transaction
  if (ctx.isFirstTransaction) {
    flags.push({
      rule: "NEW_ACCOUNT_FIRST_TRANSACTION",
      severity: "info",
      message: "First transaction from new account",
      score: FRAUD_RULES.newAccount.score,
    });
    totalScore += FRAUD_RULES.newAccount.score;
  }

  // Rule 5: High-risk destination country
  if (FRAUD_RULES.highRiskCountries.includes(ctx.destinationCountry)) {
    flags.push({
      rule: "HIGH_RISK_COUNTRY",
      severity: "warning",
      message: `Destination country ${ctx.destinationCountry} is on the high-risk list`,
      score: 30,
    });
    totalScore += 30;
  }

  // Cap the score at 100
  totalScore = Math.min(totalScore, 100);

  const riskLevel = getRiskLevel(totalScore);
  const recommendedAction = getRecommendedAction(riskLevel);

  return {
    riskScore: totalScore,
    riskLevel,
    passed: totalScore < 50,
    flags,
    recommendedAction,
  };
}

/**
 * Record a fraud check in the database
 *
 * Persists the fraud check result for auditing and compliance.
 *
 * @param params - Compliance check parameters
 */
export async function recordFraudCheck(params: {
  transferId?: string;
  tenantId?: string;
  userId: string;
  checkType: string;
  riskScore: number;
  riskLevel: string;
  details: string;
  action: string;
}): Promise<void> {
  await prisma.complianceCheck.create({
    data: {
      transferId: params.transferId,
      tenantId: params.tenantId,
      userId: params.userId,
      checkType: params.checkType,
      status: params.riskLevel === "low" ? "passed" : "flagged",
      riskScore: params.riskScore,
      riskLevel: params.riskLevel,
      details: params.details,
      action: params.action,
    },
  });
}

/**
 * Get user's fraud risk profile
 *
 * Analyzes the user's transaction history and compliance checks
 * to determine their overall risk profile.
 *
 * @param userId - The user's ID
 * @returns Risk profile with score and history
 */
export async function getUserRiskProfile(userId: string): Promise<{
  riskScore: number;
  totalTransactions: number;
  flaggedTransactions: number;
  blockedTransactions: number;
  avgTransactionAmount: number;
  maxTransactionAmount: number;
}> {
  const [complianceChecks, transactions] = await Promise.all([
    prisma.complianceCheck.count({
      where: {
        userId,
        status: "flagged",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        amount: true,
        status: true,
      },
    }),
  ]);

  const totalTransactions = transactions.length;
  const flaggedTransactions = complianceChecks;
  const blockedTransactions = transactions.filter((t) => t.status === "BLOCKED").length;

  const amounts = transactions.map((t) => t.amount);
  const avgTransactionAmount =
    amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const maxTransactionAmount = amounts.length > 0 ? Math.max(...amounts) : 0;

  // Calculate risk score (0-100)
  let riskScore = 0;

  // Flagged ratio
  if (totalTransactions > 0) {
    const flaggedRatio = flaggedTransactions / totalTransactions;
    riskScore += Math.min(flaggedRatio * 100, 50);
  }

  // Blocked count
  riskScore += Math.min(blockedTransactions * 10, 30);

  // High average amount
  if (avgTransactionAmount > 5000) {
    riskScore += 20;
  }

  riskScore = Math.min(riskScore, 100);

  return {
    riskScore: Math.round(riskScore),
    totalTransactions,
    flaggedTransactions,
    blockedTransactions,
    avgTransactionAmount: Math.round(avgTransactionAmount * 100) / 100,
    maxTransactionAmount,
  };
}
