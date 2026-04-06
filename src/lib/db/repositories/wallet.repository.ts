import type { Wallet, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BaseRepository } from "./base.repository";

export class WalletRepository extends BaseRepository<
  Wallet,
  Prisma.WalletCreateInput,
  Prisma.WalletUpdateInput
> {
  protected readonly model = prisma.wallet;

  async findByUserId(userId: string): Promise<Wallet[]> {
    return prisma.wallet.findMany({ where: { userId } });
  }

  async findByUserAndType(
    userId: string,
    walletType: string
  ): Promise<Wallet | null> {
    return prisma.wallet.findFirst({ where: { userId, walletType } });
  }

  async updateBalance(id: string, amount: number): Promise<Wallet> {
    return prisma.wallet.update({
      where: { id },
      data: { balance: { increment: amount } },
    });
  }

  // Override create to accept plain data shape (not relational Prisma shape)
  async createWallet(data: {
    userId: string;
    walletType: string;
    currency: string;
    balance: number;
  }): Promise<Wallet> {
    return prisma.wallet.create({
      data: {
        ...data,
        user: { connect: { id: data.userId } },
      },
    });
  }
}
