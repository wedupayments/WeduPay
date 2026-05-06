import { prisma } from "@/lib/prisma";
import { exportService } from "./export.service";
import { webhookService } from "./webhook.service";
import { analyticsService } from "./analytics.service";
import { ensureOpenExchangeRatesFresh } from "@/lib/open-exchange-rates";

const FX_TRACKED_SYMBOLS = [
  "USD",
  "EUR",
  "GBP",
  "KES",
  "NGN",
  "GHS",
  "ZAR",
  "TZS",
  "UGX",
  "ZMW",
  "XOF",
  "XAF",
  "MZN",
  "ZWL",
];

export class WorkerService {
  private isRunning = false;
  private pollInterval = 5000; // 5 seconds
  private lastFxRefreshCheckAt = 0;
  private readonly fxRefreshCheckIntervalMs =
    Number(process.env.FX_AUTO_REFRESH_INTERVAL_MINUTES || "30") * 60 * 1000;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[Worker] Started background task processor");

    while (this.isRunning) {
      try {
        await this.processNextTask();
        await this.processWebhookRetries();
        await this.refreshFxRatesIfNeeded();
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      } catch (error) {
        console.error("[Worker] Loop error:", error);
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      }
    }
  }

  stop() {
    this.isRunning = false;
  }

  async processNextTask() {
    const task = await prisma.asyncTask.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (!task) return;

    // Update status to PROCESSING
    await prisma.asyncTask.update({
      where: { id: task.id },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    try {
      const payload = JSON.parse(task.payload);

      if (task.type === "EXPORT_GENERATION") {
        await exportService.processExportJob(payload.jobId);
      }

      await prisma.asyncTask.update({
        where: { id: task.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      
      console.log(`[Worker] Task ${task.id} (${task.type}) completed`);
    } catch (error: any) {
      console.error(`[Worker] Task ${task.id} failed:`, error);
      await prisma.asyncTask.update({
        where: { id: task.id },
        data: { 
          status: "FAILED", 
          errorMessage: error.message,
          completedAt: new Date() 
        },
      });
    }
  }

  async processWebhookRetries() {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: "RETRYING",
        nextRetryAt: { lte: new Date() },
      },
      take: 10,
    });

    for (const delivery of deliveries) {
      console.log(`[Worker] Retrying webhook delivery ${delivery.id} (Attempt ${delivery.attemptNumber})`);
      await webhookService.attemptDelivery(delivery.id);
    }
  }

  async refreshFxRatesIfNeeded() {
    if (process.env.FX_AUTO_REFRESH_ENABLED === "false") {
      return;
    }

    const now = Date.now();
    if (now - this.lastFxRefreshCheckAt < this.fxRefreshCheckIntervalMs) {
      return;
    }

    this.lastFxRefreshCheckAt = now;

    if (!process.env.OPEN_EXCHANGE_RATES_APP_ID) {
      return;
    }

    try {
      const refreshed = await ensureOpenExchangeRatesFresh(FX_TRACKED_SYMBOLS);
      if (refreshed) {
        console.log("[Worker] FX refresh check completed");
      }
    } catch (error) {
      console.error("[Worker] FX auto-refresh failed:", error);
    }
  }

  async runDailyCleanup() {
    console.log("[Worker] Running daily cleanup jobs...");
    await Promise.all([
      exportService.cleanupExpiredExports(),
      // cacheService.deleteExpired(), // if available
      prisma.analyticsCache.deleteMany({
          where: { expiresAt: { lt: new Date() } }
      })
    ]);
    console.log("[Worker] Daily cleanup completed");
  }
}

export const workerService = new WorkerService();
