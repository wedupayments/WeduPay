import { prisma } from "@/lib/prisma";

export class CacheService {
  async get(tenantId: string, cacheKey: string) {
    const cached = await prisma.analyticsCache.findUnique({
      where: {
        tenantId_cacheKey: {
          tenantId,
          cacheKey,
        },
      },
    });

    if (!cached) return null;

    if (new Date() > cached.expiresAt) {
      await this.invalidate(tenantId, cacheKey);
      return null;
    }

    return cached.data;
  }

  async set(tenantId: string, cacheKey: string, metricType: string, data: any, ttlSeconds: number = 300) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    return prisma.analyticsCache.upsert({
      where: {
        tenantId_cacheKey: {
          tenantId,
          cacheKey,
        },
      },
      update: {
        data,
        metricType,
        expiresAt,
      },
      create: {
        tenantId,
        cacheKey,
        metricType,
        data,
        expiresAt,
      },
    });
  }

  async invalidate(tenantId: string, cacheKey: string) {
    try {
      return await prisma.analyticsCache.delete({
        where: {
          tenantId_cacheKey: {
            tenantId,
            cacheKey,
          },
        },
      });
    } catch (e) {
      // Ignore if not found
      return null;
    }
  }
  
  async deleteExpired() {
    return prisma.analyticsCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

export const cacheService = new CacheService();
