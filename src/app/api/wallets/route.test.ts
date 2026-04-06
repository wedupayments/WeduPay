/**
 * Tests for POST /api/wallets (legacy unversioned route)
 *
 * Moved from __tests__/api/wallets.test.ts to co-locate with the route handler.
 * The __tests__/api/ directory is excluded from the jest testPathPattern.
 */

import { POST } from "@/app/api/wallets/route";
import { prisma } from "@/lib/prisma";
import {
  authenticateRequest,
  requireAuth,
  requireAppUser,
} from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireAppUser: jest.fn(),
}));

describe("Wallets API - POST /api/wallets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if walletId or amount is missing", async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue({
      userId: "test-user-id",
    });
    (requireAuth as jest.Mock).mockReturnValue(null);
    (requireAppUser as jest.Mock).mockReturnValue(null);

    const req = new Request("http://localhost:3000/api/wallets", {
      method: "POST",
      body: JSON.stringify({ walletId: "wallet-1" }), // amount missing
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should successfully fund a wallet", async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue({
      userId: "test-user-id",
    });
    (requireAuth as jest.Mock).mockReturnValue(null);
    (requireAppUser as jest.Mock).mockReturnValue(null);

    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: "wallet-1",
      userId: "test-user-id",
      balance: 50,
    });
    (prisma.wallet.update as jest.Mock).mockResolvedValue({
      id: "wallet-1",
      balance: 150,
    });

    const req = new Request("http://localhost:3000/api/wallets", {
      method: "POST",
      body: JSON.stringify({ walletId: "wallet-1", amount: 100 }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.wallet.balance).toBe(150);
  });
});
