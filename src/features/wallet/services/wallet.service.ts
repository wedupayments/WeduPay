/**
 * WalletService
 *
 * Encapsulates all wallet business logic.
 * Depends only on the repository layer — no direct Prisma calls.
 */

import {
  WalletRepository,
  LedgerEntryRepository,
} from "@/lib/db/repositories";
import type { Wallet } from "@prisma/client";

const SUPPORTED_WALLET_TYPES = [
  "ecocash",
  "mpesa",
  "mtn",
  "airtel",
  "card",
] as const;

export type SupportedWalletType = (typeof SUPPORTED_WALLET_TYPES)[number];

export class WalletService {
  private readonly walletRepo: WalletRepository;
  private readonly ledgerRepo: LedgerEntryRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.ledgerRepo = new LedgerEntryRepository();
  }

  validateWalletType(type: string): boolean {
    return SUPPORTED_WALLET_TYPES.includes(
      type.toLowerCase() as SupportedWalletType
    );
  }

  async getUserWallets(userId: string): Promise<Wallet[]> {
    return this.walletRepo.findByUserId(userId);
  }

  async getWallet(
    userId: string,
    walletType: string
  ): Promise<Wallet | null> {
    return this.walletRepo.findByUserAndType(userId, walletType);
  }

  async createWallet(
    userId: string,
    walletType: string,
    currency: string,
    initialBalance = 0
  ): Promise<Wallet> {
    return this.walletRepo.createWallet({
      userId,
      walletType,
      currency,
      balance: initialBalance,
    });
  }

  async updateBalance(walletId: string, amount: number): Promise<Wallet> {
    return this.walletRepo.updateBalance(walletId, amount);
  }

  async updateWallet(
    walletId: string,
    userId: string,
    data: { nickname?: string }
  ): Promise<Wallet> {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found or access denied");
    }
    return this.walletRepo.update(walletId, data);
  }

  async getWalletBalance(walletId: string, currency: string): Promise<number> {
    return this.ledgerRepo.getAccountBalance(walletId, currency);
  }

  async getOrCreateWallet(
    userId: string,
    walletType: string,
    currency: string
  ): Promise<Wallet> {
    const existing = await this.walletRepo.findByUserAndType(
      userId,
      walletType
    );
    if (existing) return existing;
    return this.createWallet(userId, walletType, currency);
  }
}
