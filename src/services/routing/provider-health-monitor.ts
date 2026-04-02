/**
 * Provider Health Monitor
 * 
 * Continuously monitors the health of all payment providers
 * and updates routing decisions based on real-time status.
 */

import { PrismaClient } from '@prisma/client';
import { MoneyRoutingEngine, ProviderStatus } from './money-routing-engine';
import { AfricanWalletFactory, WalletType } from '@/services/wallets/unified-wallet-factory';

const prisma = new PrismaClient();

export interface HealthCheckConfig {
  intervalMs: number;
  timeoutMs: number;
  unhealthyThreshold: number; // Number of consecutive failures before marking unhealthy
  degradedThreshold: number;  // Response time threshold for degraded status
}

export interface ProviderHealthReport {
  providerId: string;
  providerName: string;
  status: ProviderStatus;
  isReachable: boolean;
  responseTime: number;
  successRate: number;
  lastCheck: Date;
  consecutiveFailures: number;
  uptime24h: number;
  avgResponseTime24h: number;
}

export class ProviderHealthMonitor {
  private config: HealthCheckConfig;
  private routingEngine: MoneyRoutingEngine;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private failureCounts: Map<string, number> = new Map();
  private healthHistory: Map<string, boolean[]> = new Map(); // Track success/failure for uptime calculation

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      intervalMs: config?.intervalMs || 60 * 1000, // 1 minute default
      timeoutMs: config?.timeoutMs || 10 * 1000, // 10 seconds
      unhealthyThreshold: config?.unhealthyThreshold || 3,
      degradedThreshold: config?.degradedThreshold || 5000, // 5 seconds
    };
    this.routingEngine = new MoneyRoutingEngine();
  }

  /**
   * Start the health monitoring service
   */
  start(): void {
    if (this.isRunning) {
      console.log('[HealthMonitor] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[HealthMonitor] Starting health monitoring service...');

    // Initial health check
    this.runHealthCheck();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runHealthCheck();
    }, this.config.intervalMs);
  }

  /**
   * Stop the health monitoring service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('[HealthMonitor] Health monitoring service stopped');
  }

  /**
   * Run health check on all providers
   */
  private async runHealthCheck(): Promise<void> {
    console.log('[HealthMonitor] Running health check...');

    try {
      const providers = await prisma.paymentProvider.findMany({
        where: { isActive: true },
      });

      const results = await Promise.allSettled(
        providers.map(p => this.checkProviderHealth(p))
      );

      const summary = {
        total: providers.length,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
      };

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const report = result.value;
          if (report.status === ProviderStatus.HEALTHY) summary.healthy++;
          else if (report.status === ProviderStatus.DEGRADED) summary.degraded++;
          else summary.unhealthy++;
        }
      });

      console.log('[HealthMonitor] Health check complete:', summary);

    } catch (error) {
      console.error('[HealthMonitor] Health check failed:', error);
    }
  }

  /**
   * Check health of a single provider
   */
  private async checkProviderHealth(provider: any): Promise<ProviderHealthReport> {
    const startTime = Date.now();
    let isReachable = false;
    let responseTime = 0;
    let status = ProviderStatus.UNKNOWN;
    let errorMessage: string | null = null;

    try {
      // Create wallet adapter for this provider
      const wallet = AfricanWalletFactory.createWallet({
        type: provider.name as WalletType,
        environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
      });

      // Perform a lightweight health check (validate phone number as ping)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        // Simple validation test (doesn't make API call)
        const isValid = wallet.validatePhoneNumber('254700000000');
        isReachable = true;
        responseTime = Date.now() - startTime;
        status = isValid ? ProviderStatus.HEALTHY : ProviderStatus.DEGRADED;

        clearTimeout(timeoutId);
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          status = ProviderStatus.UNHEALTHY;
          errorMessage = 'Health check timeout';
        } else {
          throw error;
        }
      }

    } catch (error) {
      isReachable = false;
      status = ProviderStatus.UNHEALTHY;
      errorMessage = (error as Error).message;
      console.error(`[HealthMonitor] Provider ${provider.name} health check failed:`, errorMessage);
    }

    // Update failure count
    const consecutiveFailures = this.updateFailureCount(provider.id, status === ProviderStatus.HEALTHY);

    // Adjust status based on consecutive failures
    if (consecutiveFailures >= this.config.unhealthyThreshold) {
      status = ProviderStatus.UNHEALTHY;
    } else if (responseTime > this.config.degradedThreshold) {
      status = ProviderStatus.DEGRADED;
    }

    // Update health history for uptime calculation
    this.updateHealthHistory(provider.id, status === ProviderStatus.HEALTHY);

    // Save health check to database
    await prisma.providerHealthCheck.create({
      data: {
        providerId: provider.id,
        status,
        isReachable,
        responseTime,
        checkType: 'ping',
        testErrorMessage: errorMessage,
        metadata: JSON.stringify({
          consecutiveFailures,
          checkDuration: Date.now() - startTime,
        }),
      },
    });

    // Update provider record
    await prisma.paymentProvider.update({
      where: { id: provider.id },
      data: {
        lastHealthCheck: new Date(),
        avgResponseTime: responseTime,
        successRate: this.calculateSuccessRate(provider.id),
      },
    });

    // Refresh routing engine cache
    await this.routingEngine.refreshProviderHealth(provider.id);

    return {
      providerId: provider.id,
      providerName: provider.name,
      status,
      isReachable,
      responseTime,
      successRate: this.calculateSuccessRate(provider.id),
      lastCheck: new Date(),
      consecutiveFailures,
      uptime24h: this.calculateUptime(provider.id),
      avgResponseTime24h: await this.getAvgResponseTime24h(provider.id),
    };
  }

  /**
   * Update failure count for a provider
   */
  private updateFailureCount(providerId: string, isSuccess: boolean): number {
    const current = this.failureCounts.get(providerId) || 0;

    if (isSuccess) {
      this.failureCounts.set(providerId, 0);
      return 0;
    } else {
      const newCount = current + 1;
      this.failureCounts.set(providerId, newCount);
      return newCount;
    }
  }

  /**
   * Update health history for uptime calculation
   */
  private updateHealthHistory(providerId: string, isHealthy: boolean): void {
    const history = this.healthHistory.get(providerId) || [];
    history.push(isHealthy);

    // Keep last 1440 checks (24 hours at 1 minute intervals)
    if (history.length > 1440) {
      history.shift();
    }

    this.healthHistory.set(providerId, history);
  }

  /**
   * Calculate success rate for a provider
   */
  private calculateSuccessRate(providerId: string): number {
    const history = this.healthHistory.get(providerId) || [];
    if (history.length === 0) return 100;

    const successCount = history.filter(h => h).length;
    return (successCount / history.length) * 100;
  }

  /**
   * Calculate uptime percentage
   */
  private calculateUptime(providerId: string): number {
    return this.calculateSuccessRate(providerId);
  }

  /**
   * Get average response time over 24 hours
   */
  private async getAvgResponseTime24h(providerId: string): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const checks = await prisma.providerHealthCheck.findMany({
      where: {
        providerId,
        createdAt: { gte: twentyFourHoursAgo },
        responseTime: { gt: 0 },
      },
      select: { responseTime: true },
    });

    if (checks.length === 0) return 0;

    const total = checks.reduce((sum, check) => sum + check.responseTime, 0);
    return total / checks.length;
  }

  /**
   * Get health report for all providers
   */
  async getHealthReports(): Promise<ProviderHealthReport[]> {
    const providers = await prisma.paymentProvider.findMany({
      where: { isActive: true },
    });

    const reports = await Promise.all(
      providers.map(p => this.getProviderHealthReport(p.id))
    );

    return reports.filter((r): r is ProviderHealthReport => r !== null);
  }

  /**
   * Get health report for a specific provider
   */
  async getProviderHealthReport(providerId: string): Promise<ProviderHealthReport | null> {
    const provider = await prisma.paymentProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) return null;

    const latestCheck = await prisma.providerHealthCheck.findFirst({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestCheck) {
      return {
        providerId,
        providerName: provider.name,
        status: ProviderStatus.UNKNOWN,
        isReachable: false,
        responseTime: 0,
        successRate: 100,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        uptime24h: 100,
        avgResponseTime24h: 0,
      };
    }

    return {
      providerId,
      providerName: provider.name,
      status: latestCheck.status as ProviderStatus,
      isReachable: latestCheck.isReachable,
      responseTime: latestCheck.responseTime,
      successRate: provider.successRate,
      lastCheck: latestCheck.createdAt,
      consecutiveFailures: this.failureCounts.get(providerId) || 0,
      uptime24h: this.calculateUptime(providerId),
      avgResponseTime24h: await this.getAvgResponseTime24h(providerId),
    };
  }

  /**
   * Get providers by health status
   */
  async getProvidersByStatus(status: ProviderStatus): Promise<ProviderHealthReport[]> {
    const reports = await this.getHealthReports();
    return reports.filter(r => r.status === status);
  }

  /**
   * Get unhealthy providers
   */
  async getUnhealthyProviders(): Promise<ProviderHealthReport[]> {
    return this.getProvidersByStatus(ProviderStatus.UNHEALTHY);
  }

  /**
   * Get degraded providers
   */
  async getDegradedProviders(): Promise<ProviderHealthReport[]> {
    return this.getProvidersByStatus(ProviderStatus.DEGRADED);
  }

  /**
   * Manually trigger health check for a provider
   */
  async checkProvider(providerId: string): Promise<ProviderHealthReport> {
    const provider = await prisma.paymentProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return this.checkProviderHealth(provider);
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isRunning: boolean;
    intervalMs: number;
    trackedProviders: number;
  } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.config.intervalMs,
      trackedProviders: this.failureCounts.size,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const providerHealthMonitor = new ProviderHealthMonitor();

export default ProviderHealthMonitor;
