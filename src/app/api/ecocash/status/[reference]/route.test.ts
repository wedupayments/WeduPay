import { GET } from "@/app/api/ecocash/status/[reference]/route";
import { prisma } from "@/lib/prisma";
import { ecocashAPI } from "@/lib/ecocash";

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

jest.mock("@/lib/ecocash", () => ({
  ecocashAPI: {
    lookupTransaction: jest.fn(),
  },
}));

const baseTransaction = {
  id: "txn-123",
  userId: "user-123",
  amount: 10,
  currency: "USD",
  status: "PENDING",
  reference: "EC-REF-123",
  metadata: {
    provider: "ECOCASH",
    phoneNumber: "263771234567",
    walletId: "wallet-123",
    sourceReference: "SRC-123",
    credited: false,
  },
};

describe("GET /api/ecocash/status/[reference]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("credits the wallet once when EcoCash lookup confirms success", async () => {
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(baseTransaction);
    (prisma.transaction.findUnique as jest.Mock)
      .mockResolvedValueOnce(baseTransaction)
      .mockResolvedValueOnce({
        ...baseTransaction,
        status: "COMPLETED",
        metadata: {
          ...baseTransaction.metadata,
          credited: true,
        },
      });
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: "wallet-123",
      userId: "user-123",
      currency: "USD",
      balance: 25,
    });
    (prisma.wallet.update as jest.Mock).mockResolvedValue({});
    (prisma.transaction.update as jest.Mock).mockResolvedValue({});
    (ecocashAPI.lookupTransaction as jest.Mock).mockResolvedValue({
      paymentSuccess: true,
      status: "SUCCESS",
      reference: "SRC-123",
      ecocashReference: "ECO-123",
      transactionDateTime: "2026-05-06T10:00:00Z",
      raw: { status: "SUCCESS" },
    });

    const response = await GET(
      new Request("http://localhost:3000/api/ecocash/status/EC-REF-123"),
      { params: Promise.resolve({ reference: "EC-REF-123" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(ecocashAPI.lookupTransaction).toHaveBeenCalledWith("263771234567", "SRC-123");
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: "wallet-123" },
      data: { balance: { increment: 10 } },
    });
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn-123" },
      data: expect.objectContaining({
        status: "COMPLETED",
        metadata: expect.objectContaining({
          credited: true,
          ecocashReference: "ECO-123",
        }),
      }),
    });
    expect(body.data.attributes.status).toBe("COMPLETED");
    expect(body.data.attributes.walletCredited).toBe(true);
  });

  it("does not call EcoCash when the transaction is already completed", async () => {
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue({
      ...baseTransaction,
      status: "COMPLETED",
    });

    const response = await GET(
      new Request("http://localhost:3000/api/ecocash/status/EC-REF-123"),
      { params: Promise.resolve({ reference: "EC-REF-123" }) }
    );

    expect(response.status).toBe(200);
    expect(ecocashAPI.lookupTransaction).not.toHaveBeenCalled();
    expect(prisma.wallet.update).not.toHaveBeenCalled();
  });

  it("marks pending transaction failed when EcoCash lookup fails", async () => {
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(baseTransaction);
    (prisma.transaction.findUnique as jest.Mock).mockResolvedValue({
      ...baseTransaction,
      status: "FAILED",
    });
    (prisma.transaction.update as jest.Mock).mockResolvedValue({});
    (ecocashAPI.lookupTransaction as jest.Mock).mockResolvedValue({
      paymentSuccess: false,
      status: "FAILED",
      ecocashReference: "ECO-FAILED",
      raw: { status: "FAILED" },
    });

    const response = await GET(
      new Request("http://localhost:3000/api/ecocash/status/EC-REF-123"),
      { params: Promise.resolve({ reference: "EC-REF-123" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.wallet.update).not.toHaveBeenCalled();
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: "txn-123" },
      data: {
        status: "FAILED",
        metadata: expect.objectContaining({
          ecocashReference: "ECO-FAILED",
        }),
      },
    });
    expect(body.data.attributes.status).toBe("FAILED");
  });
});
