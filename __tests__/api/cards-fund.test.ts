import { POST } from '@/app/api/cards/[id]/fund/route';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, requireAuth, requireAppUser } from '@/lib/auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    virtualCard: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('@/lib/auth', () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireAppUser: jest.fn(),
}));

describe('Cards Funding API - POST /api/cards/[id]/fund', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuth = { userId: 'user-123' };
  const mockParams = Promise.resolve({ id: 'card-123' });

  it('should successfully fund a card from a wallet', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue(mockAuth);
    (requireAuth as jest.Mock).mockReturnValue(null);
    (requireAppUser as jest.Mock).mockReturnValue(null);

    (prisma.virtualCard.findFirst as jest.Mock).mockResolvedValue({
      id: 'card-123',
      userId: 'user-123',
      balance: 10,
      currency: 'USD'
    });

    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: 'wallet-mpesa',
      userId: 'user-123',
      currency: 'KES',
      balance: 10000,
      walletType: 'M-Pesa'
    });

    (prisma.virtualCard.update as jest.Mock).mockResolvedValue({ id: 'card-123', balance: 20 });
    (prisma.wallet.update as jest.Mock).mockResolvedValue({ id: 'wallet-mpesa', balance: 8684.21 });

    const req = new Request('http://localhost:3000/api/cards/card-123/fund', {
      method: 'POST',
      body: JSON.stringify({ amount: 10, walletId: 'wallet-mpesa' }),
    });

    const res = await POST(req, { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.virtualCard.update).toHaveBeenCalled();
    expect(prisma.wallet.update).toHaveBeenCalled();
    expect(prisma.transaction.create).toHaveBeenCalled();
  });

  it('should fail if wallet has insufficient balance', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue(mockAuth);
    (requireAuth as jest.Mock).mockReturnValue(null);
    (requireAppUser as jest.Mock).mockReturnValue(null);

    (prisma.virtualCard.findFirst as jest.Mock).mockResolvedValue({
      id: 'card-123',
      userId: 'user-123',
      balance: 0,
      currency: 'USD'
    });

    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: 'wallet-empty',
      userId: 'user-123',
      currency: 'USD',
      balance: 5,
      walletType: 'EcoCash'
    });

    const req = new Request('http://localhost:3000/api/cards/card-123/fund', {
      method: 'POST',
      body: JSON.stringify({ amount: 10, walletId: 'wallet-empty' }),
    });

    const res = await POST(req, { params: mockParams });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Insufficient wallet balance');
  });
});
