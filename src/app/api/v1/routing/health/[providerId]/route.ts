/**
 * Individual Provider Health Status API
 * 
 * Get detailed health status for a specific provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProviderStatus } from '@/services/routing/money-routing-engine';

const prisma = new PrismaClient();

// ============================================
// GET PROVIDER STATUS
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const { providerId } = await params;

  console.log(`[HealthAPI] ${requestId} - Provider status request for ${providerId}`);

  try {
    // Get provider info
    const provider = await prisma.paymentProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json({
        success: false,
        requestId,
        error: 'Provider not found',
      }, { status: 404 });
    }

    // Get latest health check
    const latestCheck = await prisma.providerHealthCheck.findFirst({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });

    // Get health checks from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentChecks = await prisma.providerHealthCheck.findMany({
      where: {
        providerId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate 24h metrics
    const healthyChecks = recentChecks.filter(c => c.status === ProviderStatus.HEALTHY).length;
    const uptime24h = recentChecks.length > 0
      ? (healthyChecks / recentChecks.length) * 100
      : 100;

    const avgResponseTime24h = recentChecks.length > 0
      ? recentChecks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / recentChecks.length
      : 0;

    // Get recent transactions
    const recentTransactions = await prisma.routedTransaction.findMany({
      where: {
        selectedProviderId: providerId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const successCount = recentTransactions.filter(t => t.status === 'COMPLETED').length;
    const failedCount = recentTransactions.filter(t => t.status === 'FAILED').length;
    const transactionSuccessRate = recentTransactions.length > 0
      ? (successCount / recentTransactions.length) * 100
      : 100;

    return NextResponse.json({
      success: true,
      requestId,
      provider: {
        id: provider.id,
        name: provider.name,
        displayName: provider.displayName,
        region: provider.region,
        isActive: provider.isActive,
        priority: provider.priority,
      },
      health: {
        status: latestCheck?.status || ProviderStatus.UNKNOWN,
        isReachable: latestCheck?.isReachable || false,
        responseTime: latestCheck?.responseTime || 0,
        lastCheck: latestCheck?.createdAt,
      },
      metrics: {
        successRate: provider.successRate,
        avgResponseTime: provider.avgResponseTime,
        uptime: provider.uptime,
        uptime24h,
        avgResponseTime24h,
        transactionSuccessRate,
      },
      statistics: {
        totalTransactions24h: recentTransactions.length,
        successfulTransactions24h: successCount,
        failedTransactions24h: failedCount,
        healthChecks24h: recentChecks.length,
      },
      supportedCountries: provider.supportedCountries,
      supportedCurrencies: provider.supportedCurrencies,
      feeConfig: {
        feeType: provider.feeType,
        feePercentage: provider.feePercentage,
        feeFixed: provider.feeFixed,
        feeMinimum: provider.feeMinimum,
        feeMaximum: provider.feeMaximum,
      },
      limits: {
        minTransactionAmount: provider.minTransactionAmount,
        maxTransactionAmount: provider.maxTransactionAmount,
        dailyLimit: provider.dailyLimit,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[HealthAPI] ${requestId} - Error:`, error);

    return NextResponse.json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
