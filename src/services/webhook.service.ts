import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export class WebhookService {
  async createEndpoint(tenantId: string, userId: string, url: string, description?: string, events: string[] = ["*"]) {
    // Basic URL validation
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.protocol.startsWith("http")) {
        throw new Error("Invalid protocol");
      }
    } catch {
      throw new Error("Invalid webhook URL format");
    }

    const secretKey = `whsec_${crypto.randomBytes(24).toString("base64url")}`;

    return prisma.webhookEndpoint.create({
      data: {
        tenantId,
        userId,
        url,
        description,
        secretKey,
        events,
        isActive: true,
      },
    });
  }

  async getEndpoint(id: string) {
    return prisma.webhookEndpoint.findUnique({
      where: { id },
    });
  }

  async listEndpoints(tenantId: string) {
    return prisma.webhookEndpoint.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateEndpoint(id: string, tenantId: string, data: any) {
    return prisma.webhookEndpoint.update({
      where: { id, tenantId },
      data,
    });
  }

  async deleteEndpoint(id: string, tenantId: string) {
    return prisma.webhookEndpoint.delete({
      where: { id, tenantId },
    });
  }

  async regenerateSecret(id: string, tenantId: string) {
    const secretKey = `whsec_${crypto.randomBytes(24).toString("base64url")}`;
    return prisma.webhookEndpoint.update({
      where: { id, tenantId },
      data: { secretKey },
    });
  }

  async listDeliveries(tenantId: string, filters: { page?: number, limit?: number, endpointId?: string }) {
    const { page = 1, limit = 20, endpointId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      endpoint: {
        tenantId,
      },
    };
    if (endpointId) where.endpointId = endpointId;

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        include: {
          endpoint: {
            select: { url: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.webhookDelivery.count({ where }),
    ]);

    return {
      deliveries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async trigger(tenantId: string, eventType: string, payload: any) {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { events: { has: "*" } },
          { events: { has: eventType } },
        ],
      },
    });

    const deliveries = await Promise.all(
      endpoints.map((endpoint) => this.queueDelivery(endpoint, eventType, payload))
    );

    return deliveries;
  }

  private async queueDelivery(endpoint: any, eventType: string, payload: any) {
    const signature = this.generateSignature(endpoint.secretKey, payload);

    const delivery = await prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        eventType,
        payload,
        signature,
        status: "PENDING",
        attemptNumber: 1,
        maxAttempts: 3,
      },
    });

    // In a real system, this would be handled by a background worker
    // For this implementation, we'll trigger the first attempt asynchronously
    this.attemptDelivery(delivery.id).catch(console.error);

    return delivery;
  }

  private generateSignature(secret: string, payload: any) {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify(payload);
    const signedPayload = `${timestamp}.${body}`;
    const hmac = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    return `t=${timestamp},v1=${hmac}`;
  }

  async attemptDelivery(deliveryId: string) {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });

    if (!delivery || delivery.status === "COMPLETED") return;

    const startTime = Date.now();
    try {
      const response = await fetch(delivery.endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WeduPay-Signature": delivery.signature,
          "X-WeduPay-Event": delivery.eventType,
        },
        body: JSON.stringify(delivery.payload),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "COMPLETED",
            httpStatus: response.status,
            responseTime,
            deliveredAt: new Date(),
          },
        });

        await prisma.webhookEndpoint.update({
          where: { id: delivery.endpointId },
          data: { lastTestedAt: new Date() },
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const nextAttempt = this.calculateNextRetry(delivery.attemptNumber);

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: delivery.attemptNumber >= delivery.maxAttempts ? "FAILED" : "RETRYING",
          httpStatus: (error as any).status || null,
          responseTime,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          attemptNumber: delivery.attemptNumber + 1,
          nextRetryAt: delivery.attemptNumber >= delivery.maxAttempts ? null : nextAttempt,
        },
      });
    }
  }

  private calculateNextRetry(attempt: number): Date {
    // 1min, 5min, 15min
    const intervals = [1, 5, 15];
    const minutes = intervals[attempt - 1] || 30;
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}

export const webhookService = new WebhookService();
