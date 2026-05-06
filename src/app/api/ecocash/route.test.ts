import { POST } from "@/app/api/ecocash/route";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, requireAppUser, requireAuth } from "@/lib/auth";
import { ecocashAPI } from "@/lib/ecocash";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: {
      findFirst: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      update: jest.fn(),
    },
    webhookEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/auth", () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireAppUser: jest.fn(),
}));

jest.mock("@/lib/ecocash", () => ({
  ecocashAPI: {
    validatePhoneNumber: jest.fn(),
    formatPhoneNumber: jest.fn(),
    initPayment: jest.fn(),
  },
}));

const mockAuth = { userId: "user-123" };

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/ecocash", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/ecocash", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(mockAuth);
    (requireAuth as jest.Mock).mockReturnValue(null);
    (requireAppUser as jest.Mock).mockReturnValue(null);
    (ecocashAPI.validatePhoneNumber as jest.Mock).mockReturnValue(true);
    (ecocashAPI.formatPhoneNumber as jest.Mock).mockReturnValue("263771234567");
    (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({});
  });

  it("creates a pending wallet-funding transaction and initiates EcoCash payment", async () => {
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: "wallet-123",
      userId: "user-123",
      currency: "USD",
      balance: 25,
    });
    (prisma.transaction.create as jest.Mock).mockResolvedValue({
      id: "txn-123",
      amount: 10,
      currency: "USD",
      status: "PENDING",
      reference: "EC-123",
      createdAt: new Date("2026-05-06T10:00:00Z"),
    });
    (prisma.transaction.update as jest.Mock).mockResolvedValue({});
    (ecocashAPI.initPayment as jest.Mock).mockResolvedValue({
      status: "PENDING_VALIDATION",
      sourceReference: "SRC-123",
      message: "Prompt sent",
      raw: { status: "PENDING_VALIDATION" },
    });

    const response = await POST(makeRequest({
      amount: 10,
      currency: "USD",
      phoneNumber: "0771234567",
      walletId: "wallet-123",
      description: "Wallet top up",
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(prisma.wallet.findFirst).toHaveBeenCalledWith({
      where: { id: "wallet-123", userId: "user-123", currency: "USD" },
    });
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-123",
        amount: 10,
        currency: "USD",
        status: "PENDING",
        type: "WALLET_FUNDING",
        metadata: expect.objectContaining({
          provider: "ECOCASH",
          phoneNumber: "263771234567",
          walletId: "wallet-123",
          credited: false,
        }),
      }),
    });
    expect(ecocashAPI.initPayment).toHaveBeenCalledWith(
      "0771234567",
      10,
      "Wallet top up",
      expect.stringMatching(/^EC-/),
      "USD"
    );
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn-123" },
      data: {
        metadata: expect.objectContaining({
          sourceReference: "SRC-123",
          credited: false,
        }),
      },
    });
    expect(body.data.attributes.status).toBe("PENDING");
    expect(body.data.attributes.walletId).toBe("wallet-123");
  });

  it("rejects a wallet id that does not belong to the authenticated user", async () => {
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await POST(makeRequest({
      amount: 10,
      currency: "USD",
      phoneNumber: "0771234567",
      walletId: "wallet-missing",
    }));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("WALLET_NOT_FOUND");
    expect(ecocashAPI.initPayment).not.toHaveBeenCalled();
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it("marks the transaction failed when EcoCash initiation fails", async () => {
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.transaction.create as jest.Mock).mockResolvedValue({
      id: "txn-failed",
      amount: 10,
      currency: "USD",
      status: "PENDING",
      reference: "EC-FAILED",
      createdAt: new Date("2026-05-06T10:00:00Z"),
    });
    (ecocashAPI.initPayment as jest.Mock).mockResolvedValue({
      status: "FAILED",
      message: "Invalid merchant",
    });

    const response = await POST(makeRequest({
      amount: 10,
      currency: "USD",
      phoneNumber: "0771234567",
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid merchant");
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn-failed" },
      data: { status: "FAILED" },
    });
  });
});
