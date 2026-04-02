/**
 * Provider Health Monitoring API
 * 
 * Real-time health status of all payment providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProviderHealthMonitor } from '@/services/routing/provider-health-monitor';
import { ProviderStatus } from '@/services/routing/money-routing-engine';

const prisma = new PrismaClient();
const healthMonitor = new ProviderHealthMonitor();

// ============================================
// GET ALL PROVIDERS HEALTH
// ============================================

export async function GET(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[HealthAPI] ${requestId} - Health status request`);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ProviderStatus | null;
    const region = searchParams.get('region');

    // Build query
    const where: any = { isActive: true };

    if (region) {
      where.region = region;
    }

    const providers = await prisma.paymentProvider.findMany({
      where,
      include: {
        _count: {
          select: {
            transactions: true,
            healthChecks: true,
          },
        },
      },
      orderBy: {
        priority: 'asc',
      },
    });

    // Get health reports
    const healthReports = await Promise.all(
      providers.map(async (provider) => {
        const latestCheck = await prisma.providerHealthCheck.findFirst({
          where: { providerId: provider.id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          id: provider.id,
          name: provider.name,
          displayName: provider.displayName,
          region: provider.region,
          status: (latestCheck?.status || ProviderStatus.UNKNOWN) as ProviderStatus,
          isReachable: latestCheck?.isReachable || false,
          responseTime: latestCheck?.responseTime || 0,
          successRate: provider.successRate,
          avgResponseTime: provider.avgResponseTime,
          uptime: provider.uptime,
          lastHealthCheck: provider.lastHealthCheck,
          transactionCount: provider._count.transactions,
          healthCheckCount: provider._count.healthChecks,
          supportedCountries: provider.supportedCountries,
          supportedCurrencies: provider.supportedCurrencies,
          feePercentage: provider.feePercentage,
          feeFixed: provider.feeFixed,
        };
      })
    );

    // Filter by status if requested
    let filteredReports = healthReports;
    if (status) {
      filteredReports = healthReports.filter(r => r.status === status);
    }

    // Calculate summary
    const summary = {
      total: filteredReports.length,
      healthy: filteredReports.filter(r => r.status === ProviderStatus.HEALTHY).length,
      degraded: filteredReports.filter(r => r.status === ProviderStatus.DEGRADED).length,
      unhealthy: filteredReports.filter(r => r.status === ProviderStatus.UNHEALTHY).length,
      unknown: filteredReports.filter(r => r.status === ProviderStatus.UNKNOWN).length,
    };

    return NextResponse.json({
      success: true,
      requestId,
      summary,
      providers: filteredReports,
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

// ============================================
// REFRESH PROVIDER HEALTH
// ============================================

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[HealthAPI] ${requestId} - Refresh health request`);

  try {
    const body = await request.json();
    const { providerId } = body;

    if (providerId) {
      // Refresh specific provider
      const report = await healthMonitor.checkProvider(providerId);

      return NextResponse.json({
        success: true,
        requestId,
        provider: report,
      });
    }

    // Refresh all providers
    const reports = await healthMonitor.getHealthReports();

    return NextResponse.json({
      success: true,
      requestId,
      providers: reports,
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
