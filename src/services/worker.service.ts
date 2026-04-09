import { prisma } from "@/lib/prisma";
import { exportService } from "./export.service";
import { webhookService } from "./webhook.service";
import { analyticsService } from "./analytics.service";

export class WorkerService {
  private isRunning = false;
  private pollInterval = 5000; // 5 seconds

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[Worker] Started background task processor");

    while (this.isRunning) {
      try {
        await this.processNextTask();
        await this.processWebhookRetries();
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
