import fc from 'fast-check';
import { settlementService } from './settlement.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      aggregate: jest.fn(),
    },
    settlement: {
      aggregate: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('SettlementService Property-based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Property 19: Available Balance Calculation - Validates: Requirements 4.1
  it('should correctly calculate available balance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 1000000 }).filter(n => !isNaN(n)), // revenue
        fc.float({ min: 0, max: 1000000 }).filter(n => !isNaN(n)), // settled
        async (revenue, settled) => {
          mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: revenue } });
          mockPrisma.settlement.aggregate.mockResolvedValue({ _sum: { amount: settled } });

          const result = await settlementService.getAvailableBalance('tenant-123');
          
          expect(result.availableBalance).toBe(Math.max(0, revenue - settled));
          expect(result.totalRevenue).toBe(revenue);
          expect(result.totalSettled).toBe(settled);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 20: Next Settlement Date Calculation - Validates: Requirements 4.2
  it('should calculate next settlement date correctly for different periods', () => {
    const daily = settlementService.calculateNextSettlementDate('DAILY');
    expect(daily.getHours()).toBe(0);
    expect(daily.getTime()).toBeGreaterThan(Date.now());

    const weekly = settlementService.calculateNextSettlementDate('WEEKLY');
    expect(weekly.getDay()).toBe(1); // Monday
    expect(weekly.getHours()).toBe(0);

    const monthly = settlementService.calculateNextSettlementDate('MONTHLY');
    expect(monthly.getDate()).toBe(1);
    expect(monthly.getHours()).toBe(0);
  });

  // Property 21: Payout Amount Validation - Validates: Requirements 4.3
  it('should prevent settlement request if amount exceeds balance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 10, max: 1000 }).filter(n => !isNaN(n)), // balance
        fc.float({ min: 1001, max: 5000 }).filter(n => !isNaN(n)), // request amount
        async (balance, requestAmount) => {
          mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: balance } });
          mockPrisma.settlement.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

          await expect(
            settlementService.requestSettlement('tenant-1', 'user-1', requestAmount, 'USD', {})
          ).rejects.toThrow('Insufficient balance for settlement');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 24: Duplicate Payout Prevention - Validates: Requirements 4.7
  it('should prevent overlapping pending settlements', async () => {
    mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
    mockPrisma.settlement.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    mockPrisma.settlement.findFirst.mockResolvedValue({ id: 'existing-pending' });

    await expect(
      settlementService.requestSettlement('tenant-1', 'user-1', 100, 'USD', {})
    ).rejects.toThrow('There is already a pending settlement request');
  });
});
