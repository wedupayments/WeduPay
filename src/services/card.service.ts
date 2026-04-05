import { prisma } from "@/lib/prisma";

export interface CreateCardInput {
  userId: string;
  provider: string;
  currency?: string;
  limit?: number;
  nickname?: string;
}

export interface CardResponse {
  id: string;
  provider: string;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  status: string;
  currency: string;
  balance: number;
  limit?: number;
  isVirtual: boolean;
  nickname?: string;
  createdAt: Date;
}

export interface FundCardFromWalletInput {
  cardId: string;
  userId: string;
  amount: number;
  currency: string;
}

export class CardService {
  async createCard(input: CreateCardInput): Promise<CardResponse> {
    const cardNumber = this.generateCardNumber();
    const cardToken = this.generateCardToken();
    const lastFour = cardNumber.slice(-4);
    const expiryMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const expiryYear = String(new Date().getFullYear() + 3).slice(-2);
    const cvv = this.generateCVV();

    const card = await prisma.virtualCard.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        cardNumber: this.encryptCardNumber(cardNumber),
        cardToken,
        lastFourDigits: lastFour,
        expiryMonth,
        expiryYear,
        cvv: this.encryptCVV(cvv),
        status: "ACTIVE",
        currency: input.currency || "USD",
        balance: 0,
        limit: input.limit,
        nickname: input.nickname,
        isVirtual: true,
      },
    });

    return {
      id: card.id,
      provider: card.provider,
      lastFourDigits: card.lastFourDigits,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      status: card.status,
      currency: card.currency,
      balance: card.balance,
      limit: card.limit || undefined,
      isVirtual: card.isVirtual,
      createdAt: card.createdAt,
    };
  }

  async getUserCards(userId: string): Promise<CardResponse[]> {
    const cards = await prisma.virtualCard.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return cards.map((card) => ({
      id: card.id,
      provider: card.provider,
      lastFourDigits: card.lastFourDigits,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      status: card.status,
      currency: card.currency,
      balance: card.balance,
      limit: card.limit || undefined,
      isVirtual: card.isVirtual,
      nickname: card.nickname || undefined,
      createdAt: card.createdAt,
    }));
  }

  async getCard(cardId: string, userId: string): Promise<CardResponse | null> {
    const card = await prisma.virtualCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) return null;

    return {
      id: card.id,
      provider: card.provider,
      lastFourDigits: card.lastFourDigits,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      status: card.status,
      currency: card.currency,
      balance: card.balance,
      limit: card.limit || undefined,
      isVirtual: card.isVirtual,
      createdAt: card.createdAt,
    };
  }

  async updateCardStatus(cardId: string, userId: string, status: string): Promise<CardResponse | null> {
    const existingCard = await prisma.virtualCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!existingCard) return null;

    const card = await prisma.virtualCard.update({
      where: { id: cardId },
      data: { status },
    });

    return {
      id: card.id,
      provider: card.provider,
      lastFourDigits: card.lastFourDigits,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      status: card.status,
      currency: card.currency,
      balance: card.balance,
      limit: card.limit || undefined,
      isVirtual: card.isVirtual,
      nickname: card.nickname || undefined,
      createdAt: card.createdAt,
    };
  }
  
  async updateCard(cardId: string, userId: string, data: { status?: string; nickname?: string }): Promise<CardResponse | null> {
    const existingCard = await prisma.virtualCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!existingCard) return null;

    const card = await prisma.virtualCard.update({
      where: { id: cardId },
      data,
    });

    return {
      id: card.id,
      provider: card.provider,
      lastFourDigits: card.lastFourDigits,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      status: card.status,
      currency: card.currency,
      balance: card.balance,
      limit: card.limit || undefined,
      isVirtual: card.isVirtual,
      nickname: card.nickname || undefined,
      createdAt: card.createdAt,
    };
  }

  async fundCard(cardId: string, userId: string, amount: number): Promise<CardResponse | null> {
    const card = await prisma.virtualCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) return null;

    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: { balance: { increment: amount } },
    });

    return {
      id: updatedCard.id,
      provider: updatedCard.provider,
      lastFourDigits: updatedCard.lastFourDigits,
      expiryMonth: updatedCard.expiryMonth,
      expiryYear: updatedCard.expiryYear,
      status: updatedCard.status,
      currency: updatedCard.currency,
      balance: updatedCard.balance,
      limit: updatedCard.limit || undefined,
      isVirtual: updatedCard.isVirtual,
      createdAt: updatedCard.createdAt,
    };
  }

  async fundCardFromWallet(input: FundCardFromWalletInput): Promise<CardResponse | null> {
    const card = await prisma.virtualCard.findFirst({
      where: {
        id: input.cardId,
        userId: input.userId,
      },
    });

    if (!card || input.amount <= 0) {
      return null;
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: input.userId,
        currency: input.currency,
      },
    });

    if (!wallet || wallet.balance < input.amount) {
      return null;
    }

    const fundingReference = `CARD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const [, updatedCard] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: input.amount,
          },
        },
      }),
      prisma.virtualCard.update({
        where: { id: card.id },
        data: {
          balance: {
            increment: input.amount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: input.userId,
          amount: input.amount,
          currency: input.currency,
          status: "COMPLETED",
          type: "CARD_FUNDING",
          reference: fundingReference,
        },
      }),
    ]);

    return {
      id: updatedCard.id,
      provider: updatedCard.provider,
      lastFourDigits: updatedCard.lastFourDigits,
      expiryMonth: updatedCard.expiryMonth,
      expiryYear: updatedCard.expiryYear,
      status: updatedCard.status,
      currency: updatedCard.currency,
      balance: updatedCard.balance,
      limit: updatedCard.limit || undefined,
      isVirtual: updatedCard.isVirtual,
      createdAt: updatedCard.createdAt,
    };
  }

  async deleteCard(cardId: string, userId: string): Promise<boolean> {
    const card = await prisma.virtualCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) return false;

    await prisma.virtualCard.update({
      where: { id: cardId },
      data: { status: "CANCELLED" },
    });

    return true;
  }

  private generateCardNumber(): string {
    const prefix = "4000";
    let number = prefix;
    for (let i = 0; i < 12; i++) {
      number += Math.floor(Math.random() * 10);
    }
    const checkDigit = this.luhnCheck(number);
    return number + checkDigit;
  }

  private luhnCheck(cardNumber: string): string {
    let sum = 0;
    let isEven = true;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return String((10 - (sum % 10)) % 10);
  }

  private generateCardToken(): string {
    return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateCVV(): string {
    return String(Math.floor(100 + Math.random() * 900));
  }

  private encryptCardNumber(cardNumber: string): string {
    return Buffer.from(cardNumber).toString("base64");
  }

  private encryptCVV(cvv: string): string {
    return Buffer.from(cvv).toString("base64");
  }
}

export const cardService = new CardService();
