import fc from 'fast-check';
import { paymentLinkService } from './payment-link.service';
import { prisma } from '@/lib/prisma';

// ── Mock prisma before any imports resolve ─────────────────────────────────
jest.mock('@/lib/prisma', () => ({
  prisma: {
    paymentLink: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe('PaymentLinkService Property-based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Property 7: Payment Link ID Uniqueness - Validates: Requirements 2.1
  it('should generate unique link IDs for each creation', async () => {
    const ids = new Set();
    for (let i = 0; i < 50; i++) {
        mockPrisma.paymentLink.create.mockImplementation(({ data }: { data: any }) => Promise.resolve({ id: `p-${i}`, linkId: data.linkId, ...data }));
        const link = await paymentLinkService.createPaymentLink({
            tenantId: 't1',
            userId: 'u1',
            amount: 100,
            currency: 'USD'
        });
        expect(ids.has(link.linkId)).toBe(false);
        ids.add(link.linkId);
        expect(link.linkId).toHaveLength(64); // hex of 32 bytes
    }
  });

  // Property 9: Payment Link URL Format - Validates: Requirements 2.3
  it('should generate correctly formatted URLs', async () => {
      await fc.assert(
          fc.property(fc.stringMatching(/^[0-9a-f]{64}$/), fc.webUrl(), (linkId, baseUrl) => {
              const url = paymentLinkService.getShareableUrl(linkId, baseUrl);
              expect(url).toBe(`${baseUrl}/pay/${linkId}`);
          })
      );
  });

  // Property 13: Payment Link Validation Logic - Validates: Requirements 2.8
  it('should correctly validate payment links based on status, expiry, and limits', async () => {
      await fc.assert(
          fc.asyncProperty(
              fc.record({
                  status: fc.constantFrom('ACTIVE', 'INACTIVE', 'EXPIRED'),
                  expiresAt: fc.option(fc.date(), { nil: undefined }),
                  usageLimit: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: null }),
                  usageCount: fc.integer({ min: 0, max: 2000 })
              }),
              async (linkData) => {
                  jest.clearAllMocks();
                  const now = new Date();
                  mockPrisma.paymentLink.findUnique.mockResolvedValue({
                      id: 'id-1',
                      linkId: 'l-1',
                      tenantId: 't-1',
                      userId: 'u-1',
                      amount: 100,
                      currency: 'USD',
                      ...linkData,
                      createdAt: now,
                      updatedAt: now
                  });

                  // For the update calls in validatePaymentLink
                  mockPrisma.paymentLink.update.mockImplementation(({ data }: { data: any }) => Promise.resolve({ id: 'id-1', ...linkData, ...data }));

                  const result = await paymentLinkService.validatePaymentLink('l-1');

                  // Check logic
                  if (linkData.status !== 'ACTIVE') {
                      expect(result.valid).toBe(false);
                      expect(result.reason).toBe('INACTIVE');
                  } else if (linkData.expiresAt && now > linkData.expiresAt) {
                      expect(result.valid).toBe(false);
                      expect(result.reason).toBe('EXPIRED');
                      expect(mockPrisma.paymentLink.update).toHaveBeenCalled();
                  } else if (linkData.usageLimit !== null && linkData.usageCount >= linkData.usageLimit) {
                      expect(result.valid).toBe(false);
                      expect(result.reason).toBe('USAGE_LIMIT_REACHED');
                      expect(mockPrisma.paymentLink.update).toHaveBeenCalled();
                  } else {
                      expect(result.valid).toBe(true);
                  }
              }
          ),
          { numRuns: 100 }
      );
  });

  // Property 10 & 11: Usage Increment and Limitation - Validates: Requirements 2.4, 2.5
  it('should increment usage and deactivate if limit reached', async () => {
      await fc.assert(
          fc.asyncProperty(
              fc.integer({ min: 0, max: 100 }), // initial count
              fc.integer({ min: 1, max: 200 }), // limit
              async (initialCount, limit) => {
                  jest.clearAllMocks();
                  const baseLink = { id: '1', usageCount: initialCount, usageLimit: limit, status: 'ACTIVE' };
                  
                  // Mock update for increment
                  mockPrisma.paymentLink.update.mockImplementation(({ data }: { data: any }) => {
                      if (data.usageCount?.increment) {
                          return Promise.resolve({ ...baseLink, usageCount: initialCount + 1 });
                      }
                      if (data.status === 'INACTIVE') {
                          return Promise.resolve({ ...baseLink, usageCount: initialCount + 1, status: 'INACTIVE' });
                      }
                      return Promise.resolve(baseLink);
                  });

                  const result = await paymentLinkService.incrementUsage('1');

                  expect(mockPrisma.paymentLink.update).toHaveBeenCalled();
                  if (initialCount + 1 >= limit) {
                      expect(result.status).toBe('INACTIVE');
                  } else {
                      expect(result.usageCount).toBe(initialCount + 1);
                  }
              }
          ),
          { numRuns: 100 }
      );
  });
});
