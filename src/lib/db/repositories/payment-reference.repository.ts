import type { PaymentReference, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class PaymentReferenceRepository extends BaseRepository<
  PaymentReference,
  Prisma.PaymentReferenceCreateInput,
  Prisma.PaymentReferenceUpdateInput
> {
  protected readonly model = prisma.paymentReference as unknown as {
    findUnique: (args: { where: { id: string } }) => Promise<PaymentReference | null>;
    findMany: (args?: Record<string, unknown>) => Promise<PaymentReference[]>;
    findFirst: (args?: Record<string, unknown>) => Promise<PaymentReference | null>;
    create: (args: { data: Prisma.PaymentReferenceCreateInput }) => Promise<PaymentReference>;
    update: (args: { where: { id: string }; data: Prisma.PaymentReferenceUpdateInput }) => Promise<PaymentReference>;
    delete: (args: { where: { id: string } }) => Promise<PaymentReference>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };

  async findByUserId(userId: string): Promise<PaymentReference[]> {
    return prisma.paymentReference.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByReferenceCode(
    referenceCode: string
  ): Promise<PaymentReference | null> {
    return prisma.paymentReference.findUnique({ where: { referenceCode } });
  }
}
