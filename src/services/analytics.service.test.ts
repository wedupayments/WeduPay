import fc from 'fast-check';
import { analyticsService } from './analytics.service';
import { prisma } from '@/lib/prisma';

// ── Mock prisma before any imports resolve ─────────────────────────────────
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    analyticsCache: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    }
  },
}));

const mockPrisma = prisma as any;

describe('AnalyticsService Property-based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Property 14: Cache Integration - Validates: Requirements 2.7
  it('should return cached data if available and not expired', async () => {
    const mockData = [{ date: '2023-01-01', revenues: [] }];
    mockPrisma.analyticsCache.findUnique.mockResolvedValue({
      data: mockData,
      expiresAt: new Date(Date.now() + 10000)
    });

    const result = await analyticsService.getRevenueOverTime('t1', 'DAILY');
    expect(result).toEqual(mockData);
    expect(mockPrisma.transaction.findMany).not.toHaveBeenCalled();
  });

  // Property 15: Timeframe Aggregation Logic - Validates: Requirements 2.5
  it('should correctly aggregate transactions into date buckets based on timeframe', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('DAILY', 'WEEKLY', 'MONTHLY'),
        fc.array(
          fc.record({
            amount: fc.integer({ min: 1, max: 1000 }),
            currency: fc.constantFrom('USD', 'KES'),
                      createdAt: fc.integer({ min: 1672531200000, max: 1704067199000 }).map(v => new Date(v))
          }),
          { minLength: 1, maxLength: 50 }
        ),
        async (timeframe, txs) => {
          mockPrisma.analyticsCache.findUnique.mockResolvedValue(null);
          // Sorting by createdAt asc because the service expects it
          const sortedTxs = [...txs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          mockPrisma.transaction.findMany.mockResolvedValue(sortedTxs);
          mockPrisma.analyticsCache.upsert.mockResolvedValue({});

          const result = await analyticsService.getRevenueOverTime('t1', timeframe as any) as any[];

          expect(result.length).toBeGreaterThan(0);
          result.forEach(item => {
              if (timeframe === 'DAILY') expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
              if (timeframe === 'MONTHLY') expect(item.date).toMatch(/^\d{4}-\d{2}$/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 16: Success Rate Calculation Stability - Validates: Requirements 2.5
  it('should always return a success rate between 0 and 100', async () => {
      await fc.assert(
          fc.asyncProperty(
              fc.array(
                  fc.record({
                      status: fc.constantFrom('COMPLETED', 'FAILED', 'PENDING'),
                                createdAt: fc.integer({ min: 1672531200000, max: 1704067199000 }).map(v => new Date(v))
                  }),
                  { minLength: 1, maxLength: 50 }
              ),
              async (txs) => {
                  mockPrisma.analyticsCache.findUnique.mockResolvedValue(null);
                  const sortedTxs = [...txs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                  mockPrisma.transaction.findMany.mockResolvedValue(sortedTxs);
                  mockPrisma.analyticsCache.upsert.mockResolvedValue({});

                  const result = await analyticsService.getSuccessRateTrend('t1', 'DAILY') as any[];

                  result.forEach(item => {
                      expect(item.successRate).toBeGreaterThanOrEqual(0);
                      expect(item.successRate).toBeLessThanOrEqual(100);
                  });
              }
          ),
          { numRuns: 100 }
      );
  });
});
