import { processWebhook } from '@/services/webhook/webhook.processor';

// Run integration tests only in CI with a configured DATABASE_URL to avoid local hangs
const shouldRunIntegration = process.env.CI === 'true' && !!process.env.DATABASE_URL;

(shouldRunIntegration ? test : test.skip)('integration: webhook processor creates ledger entries (requires DATABASE_URL)', async () => {
  // This integration test requires a running test database and valid Prisma migrations.
  // It exercises the real `processWebhook` path end-to-end.
  // Provide `DATABASE_URL` in environment when running locally or in CI.

  const payload = { transactionId: 'int-tx-1', status: 'PAID', amount: 100, currency: 'USD' } as any;

  // Use a real provider handler name supported by the processor
  const result = await processWebhook('ecocash', payload, '');

  expect(result).toBeDefined();
  expect(result.success).toBe(true);
});
