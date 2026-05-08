import { ledgerService } from './index';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    ledgerEntry: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe('LedgerService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create double entries via repository', async () => {
    mockPrisma.ledgerEntry.createMany.mockResolvedValue({ count: 2 });

    const debits = [{ accountId: 'wallet-1', amount: 10, currency: 'USD' }];
    const credits = [{ accountId: 'PLATFORM_SETTLEMENT', amount: 10, currency: 'USD' }];

    const res = await ledgerService.createDoubleEntry('tx-1', debits, credits);

    expect(mockPrisma.ledgerEntry.createMany).toHaveBeenCalled();
    expect(res).toBeDefined();
  });

  it('should compute account balance from groupBy result', async () => {
    mockPrisma.ledgerEntry.groupBy.mockResolvedValueOnce([
      { entryType: 'DEBIT', _sum: { amount: 5 } },
      { entryType: 'CREDIT', _sum: { amount: 20 } },
    ]);

    const balance = await ledgerService.getAccountStatement('wallet-1', 'USD');

    expect(mockPrisma.ledgerEntry.groupBy).toHaveBeenCalled();
    expect(balance.balance).toBe(15);
  });
});
