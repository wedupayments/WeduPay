import fc from 'fast-check';
import { transactionService } from './transaction.service';
import { prisma } from '@/lib/prisma';

// ── Mock prisma before any imports resolve ─────────────────────────────────
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe('TransactionService Property-based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Property 2: Filter Query Construction - Validates: Requirements 1.3
  it('should correctly construct the where clause based on filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantId: fc.option(fc.uuid(), { nil: undefined }),
          userId: fc.option(fc.uuid(), { nil: undefined }),
          status: fc.option(fc.constantFrom('PENDING', 'COMPLETED', 'FAILED'), { nil: undefined }),
          type: fc.option(fc.constantFrom('PAYMENT', 'REFUND', 'TRANSFER'), { nil: undefined }),
          currency: fc.option(fc.constantFrom('USD', 'KES', 'TZS', 'UGX'), { nil: undefined }),
          dateFrom: fc.option(fc.date(), { nil: undefined }),
          dateTo: fc.option(fc.date(), { nil: undefined }),
        }),
        async (filters) => {
          jest.clearAllMocks();
          mockPrisma.transaction.findMany.mockResolvedValue([]);
          mockPrisma.transaction.count.mockResolvedValue(0);

          await transactionService.getTransactions(filters as any);

          const call = mockPrisma.transaction.findMany.mock.calls[0][0];
          const where = call.where;

          if (filters.tenantId) expect(where.tenantId).toBe(filters.tenantId);
          if (filters.userId) expect(where.userId).toBe(filters.userId);
          if (filters.status) expect(where.status).toBe(filters.status);
          if (filters.type) expect(where.type).toBe(filters.type);
          if (filters.currency) expect(where.currency).toBe(filters.currency);
          
          if (filters.dateFrom || filters.dateTo) {
            expect(where.createdAt).toBeDefined();
            if (filters.dateFrom) expect(where.createdAt.gte).toEqual(filters.dateFrom);
            if (filters.dateTo) expect(where.createdAt.lte).toEqual(filters.dateTo);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: Pagination Correctness - Validates: Requirements 1.4
  it('should correctly calculate skip and take for pagination', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // page
        fc.integer({ min: 1, max: 100 }), // limit
        async (page, limit) => {
          jest.clearAllMocks();
          mockPrisma.transaction.findMany.mockResolvedValue([]);
          mockPrisma.transaction.count.mockResolvedValue(0);

          await transactionService.getTransactions({ page, limit });

          const call = mockPrisma.transaction.findMany.mock.calls[0][0];
          expect(call.skip).toBe((page - 1) * limit);
          expect(call.take).toBe(limit);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 4: User Relation Inclusion - Validates: Requirements 1.5
  it('should always include user relation with specific fields', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([]);
    mockPrisma.transaction.count.mockResolvedValue(0);

    await transactionService.getTransactions({});

    const call = mockPrisma.transaction.findMany.mock.calls[0][0];
    expect(call.include).toBeDefined();
    expect(call.include.user).toBeDefined();
    expect(call.include.user.select).toMatchObject({
      id: true,
      email: true,
      phoneNumber: true,
    });
  });

  // Property 5: Aggregate Calculation Accuracy - Validates: Requirements 1.6
  it('should correctly group results by currency and calculate aggregates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            currency: fc.constantFrom('USD', 'KES', 'TZS'),
            _count: fc.record({ _all: fc.integer({ min: 1, max: 200 }) }),
          })
        ),
        async (mockStats) => {
          jest.clearAllMocks();
          // Normalize mockStats to have unique currencies
          const uniqueStatsMap = new Map();
          mockStats.forEach(s => uniqueStatsMap.set(s.currency, s));
          const uniqueStats = Array.from(uniqueStatsMap.values());

          mockPrisma.transaction.groupBy.mockImplementation(({ where }: any) => {
            if (where?.status === 'COMPLETED') {
              return Promise.resolve(uniqueStats.map(s => ({
                currency: s.currency,
                _count: { _all: Math.floor(s._count._all / 2) },
                _sum: { amount: s._count._all * 10 }
              })));
            }
            return Promise.resolve(uniqueStats);
          });

          const result = await transactionService.getTransactionStats({});

          expect(result.length).toBe(uniqueStats.length);
          uniqueStats.forEach(stat => {
            const res = result.find(r => r.currency === stat.currency);
            expect(res).toBeDefined();
            expect(res?.totalCount).toBe(stat._count._all);
            expect(res?.successfulCount).toBe(Math.floor(stat._count._all / 2));
            expect(res?.totalRevenue).toBe(stat._count._all * 10);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 6: Default Ordering - Validates: Requirements 1.7
  it('should default ordering by createdAt DESC', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([]);
    mockPrisma.transaction.count.mockResolvedValue(0);

    await transactionService.getTransactions({});

    const call = mockPrisma.transaction.findMany.mock.calls[0][0];
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
  });
});
