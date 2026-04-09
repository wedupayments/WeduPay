import fc from 'fast-check';
import { webhookService } from './webhook.service';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    webhookEndpoint: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    webhookDelivery: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('WebhookService Property-based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Property 26: URL Format Validation - Validates: Requirements 5.3
  it('should validate webhook URL format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => !s.startsWith('http')),
        async (invalidUrl) => {
          await expect(
            webhookService.createEndpoint('tenant-1', 'user-1', invalidUrl)
          ).rejects.toThrow('Invalid webhook URL format');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 30: HMAC Signature Generation - Validates: Requirements 5.8
  it('should generate valid HMAC signatures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 32 }), // secret
        fc.object(), // payload
        async (secret, payload) => {
          // Access private method for testing
          const signature = (webhookService as any).generateSignature(secret, payload);
          
          expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
          
          const [tPart, vPart] = signature.split(',');
          const timestamp = tPart.split('=')[1];
          const hmac = vPart.split('=')[1];
          
          const expectedHmac = crypto
            .createHmac('sha256', secret)
            .update(`${timestamp}.${JSON.stringify(payload)}`)
            .digest('hex');
            
          expect(hmac).toBe(expectedHmac);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 31: Secret Key Regeneration - Validates: Requirements 5.10
  it('should regenerate secret keys with correct prefix', async () => {
    mockPrisma.webhookEndpoint.update.mockResolvedValue({ id: 'ep-1' } as any);
    
    await webhookService.regenerateSecretKey('ep-1');
    
    const call = mockPrisma.webhookEndpoint.update.mock.calls[0][0];
    expect(call.data.secretKey).toMatch(/^whsec_/);
  });
});
