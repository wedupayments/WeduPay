import { processWebhook } from './webhook.processor';
import { prisma } from '@/lib/prisma';
import { ledgerService } from '@/services';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: { findFirst: jest.fn(), update: jest.fn() },
    p2PTransfer: { findFirst: jest.fn(), update: jest.fn() },
    idempotencyRecord: { findUnique: jest.fn(), create: jest.fn() },
    webhookEvent: { create: jest.fn() },
  },
}));

jest.mock('@/services', () => ({
  ledgerService: { createDoubleEntry: jest.fn() },
}));

const mockPrisma = prisma as any;
const mockLedger = ledgerService as any;

describe('webhook.processor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates ledger entries when transaction completes', async () => {
    mockPrisma.idempotencyRecord.findUnique.mockResolvedValue(null);
    // Ensure `credited: true` so the wallet-credit branch is skipped in updateTransactionStatus
    mockPrisma.transaction.findFirst.mockResolvedValue({ id: 'tx-1', userId: 'user-1', amount: 10, currency: 'USD', metadata: { walletId: 'wallet-1', credited: true } });
    mockPrisma.transaction.update.mockResolvedValue({ id: 'tx-1', status: 'COMPLETED' });

    const result = await processWebhook('ecocash', { transactionId: 'tx-1', status: 'PAID', amount: 10, currency: 'USD' }, '');

    expect(result.success).toBe(true);
    expect(mockLedger.createDoubleEntry).toHaveBeenCalled();
  });
});
