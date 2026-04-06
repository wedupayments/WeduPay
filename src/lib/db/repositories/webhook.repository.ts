import type { WebhookEvent, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class WebhookEventRepository extends BaseRepository<
  WebhookEvent,
  Prisma.WebhookEventCreateInput,
  Prisma.WebhookEventUpdateInput
> {
  protected readonly model = prisma.webhookEvent;

  async findByProvider(provider: string, limit = 100): Promise<WebhookEvent[]> {
    return prisma.webhookEvent.findMany({
      where: { provider },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findUnprocessed(limit = 50): Promise<WebhookEvent[]> {
    return prisma.webhookEvent.findMany({
      where: { status: "RECEIVED" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async markProcessed(id: string): Promise<WebhookEvent> {
    return prisma.webhookEvent.update({
      where: { id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  }

  async markFailed(id: string, error: string): Promise<WebhookEvent> {
    return prisma.webhookEvent.update({
      where: { id },
      data: { status: "FAILED", errorMessage: error },
    });
  }
}
