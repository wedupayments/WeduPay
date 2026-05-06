import { GET } from "@/app/api/mpesa/status/[checkoutRequestId]/route";
import { prisma } from "@/lib/prisma";
import { mpesaAPI } from "@/lib/mpesa";
import { authenticateRequest, requireAppUser, requireAuth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock("@/lib/mpesa", () => ({
  mpesaAPI: {
    querySTKStatus: jest.fn(),
  },
}));

jest.mock("@/lib/auth", () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireAppUser: jest.fn(),
}));

const baseTransaction = {
  id: "txn-123",
  userId: "user-123",
  amount: 500,
  currency: "KES",
  status: "PENDING",
  reference: "MP-REF-123",
  metadata: {
    provider: "MPESA",
    phoneNumber: "254712345678",
    walletId: "wallet-kes",
    checkoutRequestId: "ws_CO_123",
    credited: false,
  },
};

describe("GET /api/mpesa/status/[checkoutRequestId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "user-123" });
    (requireAuth as jest.Mock).mockReturnValue(null);
    (requireAppUser as jest.Mock).mockReturnValue(null);
  });

  it("credits the wallet once when Safaricom confirms success", async () => {
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(baseTransaction);
    (prisma.transaction.findUnique as jest.Mock)
      .mockResolvedValueOnce(baseTransaction)
      .mockResolvedValueOnce({
        ...baseTransaction,
        status: "COMPLETED",
        metadata: {
          ...baseTransaction.metadata,
          credited: true,
          transactionReceipt: "QWE123XYZ",
        },
      });
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: "wallet-kes",
      userId: "user-123",
      currency: "KES",
      balance: 100,
    });
    (prisma.wallet.update as jest.Mock).mockResolvedValue({});
    (prisma.transaction.update as jest.Mock).mockResolvedValue({});
    (mpesaAPI.querySTKStatus as jest.Mock).mockResolvedValue({
      responseCode: "0",
      responseDescription: "The service request is processed successfully.",
      transactionReceipt: "QWE123XYZ",
      transactionDate: "20260506120000",
      transactionAmount: 500,
      raw: { ResponseCode: "0" },
    });

    const response = await GET(
      new Request("http://localhost:3000/api/mpesa/status/ws_CO_123"),
      { params: Promise.resolve({ checkoutRequestId: "ws_CO_123" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mpesaAPI.querySTKStatus).toHaveBeenCalledWith("ws_CO_123");
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: "wallet-kes" },
      data: { balance: { increment: 500 } },
    });
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn-123" },
      data: expect.objectContaining({
        status: "COMPLETED",
        metadata: expect.objectContaining({
          credited: true,
          transactionReceipt: "QWE123XYZ",
        }),
      }),
    });
    expect(body.data.attributes.status).toBe("COMPLETED");
    expect(body.data.attributes.walletCredited).toBe(true);
  });

  it("does not call Safaricom when the transaction is already completed", async () => {
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue({
      ...baseTransaction,
      status: "COMPLETED",
      metadata: {
        ...baseTransaction.metadata,
        credited: true,
      },
    });

    const response = await GET(
      new Request("http://localhost:3000/api/mpesa/status/ws_CO_123"),
      { params: Promise.resolve({ checkoutRequestId: "ws_CO_123" }) }
    );

    expect(response.status).toBe(200);
    expect(mpesaAPI.querySTKStatus).not.toHaveBeenCalled();
    expect(prisma.wallet.update).not.toHaveBeenCalled();
  });

  it("marks the pending transaction failed when Safaricom returns a terminal error", async () => {
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(baseTransaction);
    (prisma.transaction.findUnique as jest.Mock).mockResolvedValue({
      ...baseTransaction,
      status: "FAILED",
      metadata: {
        ...baseTransaction.metadata,
        transactionReceipt: "FAILED123",
      },
    });
    (prisma.transaction.update as jest.Mock).mockResolvedValue({});
    (mpesaAPI.querySTKStatus as jest.Mock).mockResolvedValue({
      responseCode: "999999",
      responseDescription: "Request failed",
      transactionReceipt: "FAILED123",
      raw: { ResultCode: "1032" },
    });

    const response = await GET(
      new Request("http://localhost:3000/api/mpesa/status/ws_CO_123"),
      { params: Promise.resolve({ checkoutRequestId: "ws_CO_123" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.wallet.update).not.toHaveBeenCalled();
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn-123" },
      data: {
        status: "FAILED",
        metadata: expect.objectContaining({
          transactionReceipt: "FAILED123",
        }),
      },
    });
    expect(body.data.attributes.status).toBe("FAILED");
  });
});
