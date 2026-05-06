import { POST } from "@/app/api/mpesa/route";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, requireAppUser, requireAuth } from "@/lib/auth";
import { mpesaAPI } from "@/lib/mpesa";

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

jest.mock("@/lib/mpesa", () => ({
  mpesaAPI: {
    validatePhoneNumber: jest.fn(),
    formatPhoneNumber: jest.fn(),
    getCallbackUrl: jest.fn(),
    initiateSTKPush: jest.fn(),
  },
}));

const mockAuth = { userId: "user-123" };

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/mpesa", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/mpesa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(mockAuth);
    (requireAuth as jest.Mock).mockReturnValue(null);
    (requireAppUser as jest.Mock).mockReturnValue(null);
    (mpesaAPI.validatePhoneNumber as jest.Mock).mockReturnValue(true);
    (mpesaAPI.formatPhoneNumber as jest.Mock).mockReturnValue("254712345678");
    (mpesaAPI.getCallbackUrl as jest.Mock).mockReturnValue(
      "https://wedupay.example/api/v1/webhooks/mpesa"
    );
    (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({});
  });

  it("creates a pending KES wallet-funding transaction and initiates STK push", async () => {
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: "wallet-kes",
      userId: "user-123",
      currency: "KES",
      balance: 100,
    });
    (prisma.transaction.create as jest.Mock).mockResolvedValue({
      id: "txn-123",
      amount: 500,
      currency: "KES",
      status: "PENDING",
      reference: "MP-123",
      createdAt: new Date("2026-05-06T10:00:00Z"),
    });
    (prisma.transaction.update as jest.Mock).mockResolvedValue({});
    (mpesaAPI.initiateSTKPush as jest.Mock).mockResolvedValue({
      responseCode: "0",
      responseDescription: "Accepted",
      customerMessage: "Request accepted",
      checkoutRequestId: "ws_CO_123",
      merchantRequestId: "merchant-123",
      raw: { ResponseCode: "0" },
    });

    const response = await POST(
      makeRequest({
        amount: 500,
        currency: "KES",
        phoneNumber: "0712345678",
        walletId: "wallet-kes",
        description: "Wallet funding",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(prisma.wallet.findFirst).toHaveBeenCalledWith({
      where: { id: "wallet-kes", userId: "user-123", currency: "KES" },
    });
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-123",
        amount: 500,
        currency: "KES",
        status: "PENDING",
        type: "WALLET_FUNDING",
        metadata: expect.objectContaining({
          provider: "MPESA",
          phoneNumber: "254712345678",
          walletId: "wallet-kes",
          credited: false,
        }),
      }),
    });
    expect(mpesaAPI.initiateSTKPush).toHaveBeenCalledWith({
      phoneNumber: "0712345678",
      amount: 500,
      reference: expect.stringMatching(/^MP-/),
      description: "Wallet funding",
      callbackUrl: "https://wedupay.example/api/v1/webhooks/mpesa",
    });
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn-123" },
      data: {
        metadata: expect.objectContaining({
          checkoutRequestId: "ws_CO_123",
          merchantRequestId: "merchant-123",
          credited: false,
        }),
      },
    });
    expect(body.data.attributes.status).toBe("PENDING");
    expect(body.data.attributes.walletId).toBe("wallet-kes");
  });

  it("rejects non-KES wallet funding requests", async () => {
    const response = await POST(
      makeRequest({
        amount: 100,
        currency: "USD",
        phoneNumber: "0712345678",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_CURRENCY");
    expect(mpesaAPI.initiateSTKPush).not.toHaveBeenCalled();
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it("marks the transaction failed when STK push initiation fails", async () => {
    (prisma.transaction.create as jest.Mock).mockResolvedValue({
      id: "txn-failed",
      amount: 100,
      currency: "KES",
      status: "PENDING",
      reference: "MP-FAILED",
      createdAt: new Date("2026-05-06T10:00:00Z"),
    });
    (mpesaAPI.initiateSTKPush as jest.Mock).mockResolvedValue({
      responseCode: "400.002.02",
      responseDescription: "Invalid Access Token",
      customerMessage: "Request failed",
    });

    const response = await POST(
      makeRequest({
        amount: 100,
        currency: "KES",
        phoneNumber: "0712345678",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid Access Token");
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn-failed" },
      data: { status: "FAILED" },
    });
  });
});
