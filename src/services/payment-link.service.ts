import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface CreatePaymentLinkInput {
  tenantId: string;
  userId: string;
  amount: number;
  currency: string;
  description?: string;
  expiresAt?: Date;
  usageLimit?: number;
  metadata?: any;
}

export class PaymentLinkService {
  async createPaymentLink(input: CreatePaymentLinkInput) {
    const linkId = crypto.randomBytes(32).toString("hex");

    return prisma.paymentLink.create({
      data: {
        ...input,
        linkId,
        status: "ACTIVE",
      },
    });
  }

  async getPaymentLink(linkId: string) {
    return prisma.paymentLink.findUnique({
      where: { linkId },
    });
  }

  async listPaymentLinks(tenantId: string, filters: { page?: number, limit?: number, status?: string }) {
    const { page = 1, limit = 10, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;

    const [links, total] = await Promise.all([
      prisma.paymentLink.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.paymentLink.count({ where }),
    ]);

    return {
      links,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updatePaymentLink(id: string, tenantId: string, data: any) {
    return prisma.paymentLink.update({
      where: { id, tenantId },
      data,
    });
  }

  async validatePaymentLink(linkId: string) {
    const link = await this.getPaymentLink(linkId);

    if (!link) {
      return { valid: false, reason: "NOT_FOUND" };
    }

    if (link.status !== "ACTIVE") {
      return { valid: false, reason: "INACTIVE", link };
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      // Auto-expire
      await prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: "EXPIRED" },
      });
      return { valid: false, reason: "EXPIRED", link: { ...link, status: "EXPIRED" } };
    }

    if (link.usageLimit !== null && link.usageCount >= link.usageLimit) {
      // Auto-deactivate
      await prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: "INACTIVE" },
      });
      return { valid: false, reason: "USAGE_LIMIT_REACHED", link: { ...link, status: "INACTIVE" } };
    }

    return { valid: true, link };
  }

  async incrementUsage(id: string) {
    const link = await prisma.paymentLink.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    // Check if limit reached after increment
    if (link.usageLimit !== null && link.usageCount >= link.usageLimit) {
      await prisma.paymentLink.update({
        where: { id },
        data: { status: "INACTIVE" },
      });
      return { ...link, status: "INACTIVE" };
    }

    return link;
  }

  async getPaymentLinkMetrics(tenantId: string) {
    const links = await prisma.paymentLink.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return links.map((link) => ({
      id: link.id,
      linkId: link.linkId,
      amount: link.amount,
      currency: link.currency,
      usageCount: link.usageCount,
      transactionCount: link._count.transactions,
      conversionRate: link.usageCount > 0 ? (link._count.transactions / link.usageCount) * 100 : 0,
      status: link.status,
      expiresAt: link.expiresAt,
    }));
  }

  getShareableUrl(linkId: string, baseUrl: string = "http://localhost:3000") {
    return `${baseUrl}/pay/${linkId}`;
  }
}

export const paymentLinkService = new PaymentLinkService();
