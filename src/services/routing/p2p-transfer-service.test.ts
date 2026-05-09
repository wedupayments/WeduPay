/**
 * P2PTransferService unit tests
 *
 * Tests fee calculation, currency mapping, delivery estimation, compliance scoring,
 * transfer history pagination, recipient management, and the executeTransfer
 * happy-path / failure / rollback flows.
 *
 * All external I/O (Prisma, CrossBorderRoutingEngine, MoneyRoutingEngine,
 * getWalletBalance) is mocked — no database required.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@prisma/client', () => {
  const p2PTransferCreate = jest.fn();
  const p2PTransferUpdate = jest.fn();
  const p2PTransferFindUnique = jest.fn();
  const p2PTransferFindMany = jest.fn();
  const p2PTransferCount = jest.fn();
  const walletUpdateMany = jest.fn();
  const transactionCreate = jest.fn();
  const transactionUpdateMany = jest.fn();
  const userFindUnique = jest.fn();
  const transferRecipientFindFirst = jest.fn();
  const transferRecipientCreate = jest.fn();
  const transferRecipientUpdate = jest.fn();
  const transferRecipientFindMany = jest.fn();
  const transferRecipientDeleteMany = jest.fn();
  const transferLimitFindFirst = jest.fn();
  const complianceCheckCreate = jest.fn();
  const $transaction = jest.fn();

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      p2PTransfer: {
        create: p2PTransferCreate,
        update: p2PTransferUpdate,
        findUnique: p2PTransferFindUnique,
        findMany: p2PTransferFindMany,
        count: p2PTransferCount,
      },
      wallet: { updateMany: walletUpdateMany },
      transaction: { create: transactionCreate, updateMany: transactionUpdateMany },
      user: { findUnique: userFindUnique },
      transferRecipient: {
        findFirst: transferRecipientFindFirst,
        create: transferRecipientCreate,
        update: transferRecipientUpdate,
        findMany: transferRecipientFindMany,
        deleteMany: transferRecipientDeleteMany,
      },
      transferLimit: { findFirst: transferLimitFindFirst },
      complianceCheck: { create: complianceCheckCreate },
      $transaction,
    })),
  };
});

jest.mock('@/services/routing/cross-border-routing', () => ({
  CrossBorderRoutingEngine: jest.fn().mockImplementation(() => ({
    findOptimalRoute: jest.fn(),
  })),
}));

jest.mock('@/services/routing/money-routing-engine', () => ({
  MoneyRoutingEngine: jest.fn().mockImplementation(() => ({
    executePayment: jest.fn(),
  })),
}));

jest.mock('@/services/wallet-balance.service', () => ({
  getWalletBalance: jest.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { P2PTransferService } from './p2p-transfer-service';
import { CrossBorderRoutingEngine } from './cross-border-routing';
import { MoneyRoutingEngine } from './money-routing-engine';
import { getWalletBalance } from '@/services/wallet-balance.service';
import { PrismaClient } from '@prisma/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFxResult(overrides: Record<string, unknown> = {}) {
  return {
    bestRoute: {
      recipientGets: 91875,
      targetCurrency: 'TZS',
      exchangeRate: 19.45,
      fees: { fxFee: 918.75, providerFee: 0, totalFees: 918.75 },
      route: { provider: 'flutterwave', fxRoute: 'direct' },
      ...overrides,
    },
    allRoutes: [],
    savings: { amount: 0, percentage: 0 },
    recommendation: 'Best route: flutterwave via direct',
  };
}

function makeTransferRequest(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    userId: 'user-001',
    sendAmount: 5000,
    sendCurrency: 'KES',
    recipientPhone: '255712345678',
    recipientCountry: 'TZ',
    recipientName: 'John Doe',
    description: 'Family support',
    saveRecipient: false,
    ...overrides,
  } as Parameters<P2PTransferService['executeTransfer']>[0];
}

function makeGenLimits() {
  return { transactionMin: 1, transactionMax: 100_000, dailyMin: 1, dailyMax: 500_000, kycRequired: false };
}

function makeTransferRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'transfer-uuid',
    transferRef: 'P2P-1234-abc',
    status: 'PROCESSING',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('P2PTransferService', () => {
  let service: P2PTransferService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let crossBorderEngine: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routingEngine: any;

  // PrismaClient, CrossBorderRoutingEngine, MoneyRoutingEngine are module-level consts.
  // Their mock.results are populated at import time. Capture before clearAllMocks runs.
  beforeAll(() => {
    prisma = (PrismaClient as jest.Mock).mock.results[0]?.value;
    crossBorderEngine = (CrossBorderRoutingEngine as jest.Mock).mock.results[0]?.value;
    routingEngine = (MoneyRoutingEngine as jest.Mock).mock.results[0]?.value;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new P2PTransferService();
  });

  // ── calculateTransferFee (private, tested via getTransferQuote) ──────────

  describe('fee tiers', () => {
    const cases: Array<[number, string, number]> = [
      [100, 'KES', 2],        // 2% of 100 = 2 → ≥ min(1)
      [500, 'KES', 10],       // 2% of 500 = 10
      [1500, 'KES', 22.5],    // 1.5% of 1500 = 22.5
      [6000, 'KES', 60],      // 1.0% of 6000 = 60
      [12000, 'KES', 60],     // 0.5% of 12000 = 60 → capped at max(500)
      [200000, 'KES', 500],   // 0.5% of 200000 = 1000 → capped at 500
    ];

    it.each(cases)(
      'amount %d %s → fee %d',
      async (sendAmount, sendCurrency, expectedFee) => {
        prisma.transferLimit.findFirst.mockResolvedValue(
          { transactionMin: 1, transactionMax: 1_000_000, dailyMin: 1, dailyMax: 1_000_000, kycRequired: false }
        );

        crossBorderEngine.findOptimalRoute.mockResolvedValue(
          makeFxResult({ recipientGets: sendAmount * 18, targetCurrency: 'TZS' })
        );

        const quote = await service.getTransferQuote({ userId: 'u', sendAmount, sendCurrency, recipientPhone: '255700000000', recipientCountry: 'TZ' });
        expect(quote.fees.transferFee).toBeCloseTo(expectedFee, 5);
      }
    );
  });

  // ── getCurrencyForCountry ────────────────────────────────────────────────

  describe('getCurrencyForCountry', () => {
    const cases: Array<[string, string]> = [
      ['KE', 'KES'],
      ['TZ', 'TZS'],
      ['UG', 'UGX'],
      ['NG', 'NGN'],
      ['GH', 'GHS'],
      ['ZW', 'USD'],
      ['ZA', 'ZAR'],
      ['XX', 'USD'], // unknown → fallback USD
    ];

    it.each(cases)('country %s → currency %s', async (country, expectedCurrency) => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult({ targetCurrency: expectedCurrency }));
      prisma.transferLimit.findFirst.mockResolvedValue(null);

      await service.getTransferQuote({ userId: 'u', sendAmount: 100, sendCurrency: 'USD', recipientPhone: '1234567890', recipientCountry: country });

      expect(crossBorderEngine.findOptimalRoute).toHaveBeenCalledWith(
        expect.objectContaining({ targetCurrency: expectedCurrency })
      );
    });
  });

  // ── estimateDeliveryTime ─────────────────────────────────────────────────

  describe('estimateDeliveryTime', () => {
    const instantProviders = ['mpesa', 'airtel', 'mtn', 'ecocash', 'paystack', 'flutterwave'];

    it.each(instantProviders)('returns Instant for %s', async (provider) => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(
        makeFxResult({ route: { provider, fxRoute: 'direct' } })
      );
      prisma.transferLimit.findFirst.mockResolvedValue(null);

      const quote = await service.getTransferQuote({ userId: 'u', sendAmount: 100, sendCurrency: 'KES', recipientPhone: '1234567890', recipientCountry: 'TZ' });
      expect(quote.estimatedDelivery).toBe('Instant');
    });

    it('returns Within 24 hours for unknown provider', async () => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(
        makeFxResult({ route: { provider: 'unknown_bank', fxRoute: 'direct' } })
      );
      prisma.transferLimit.findFirst.mockResolvedValue(null);

      const quote = await service.getTransferQuote({ userId: 'u', sendAmount: 100, sendCurrency: 'KES', recipientPhone: '1234567890', recipientCountry: 'TZ' });
      expect(quote.estimatedDelivery).toBe('Within 24 hours');
    });
  });

  // ── getTransferQuote ─────────────────────────────────────────────────────

  describe('getTransferQuote', () => {
    beforeEach(() => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());
    });

    it('returns quote shape with correct totalDebit', async () => {
      const quote = await service.getTransferQuote(makeTransferRequest() as any);

      expect(quote.sendAmount).toBe(5000);
      expect(quote.sendCurrency).toBe('KES');
      expect(quote.receiveCurrency).toBe('TZS');
      expect(quote.receiveAmount).toBe(91875);
      expect(quote.totalDebit).toBeCloseTo(quote.sendAmount + quote.fees.totalFees, 5);
      expect(quote.route.provider).toBe('flutterwave');
    });

    it('throws when amount is below transactionMin from DB limits', async () => {
      prisma.transferLimit.findFirst.mockResolvedValue({
        dailyMin: 100, dailyMax: 10000, transactionMin: 500, transactionMax: 5000,
        monthlyMax: null, kycRequired: false,
      });
      // Use near-zero fxFee so totalDebit ≈ sendAmount (10), which is < transactionMin (500)
      crossBorderEngine.findOptimalRoute.mockResolvedValue(
        makeFxResult({ fees: { fxFee: 0.1, providerFee: 0, totalFees: 0.1 } })
      );

      await expect(
        service.getTransferQuote({ userId: 'u', sendAmount: 10, sendCurrency: 'KES', recipientPhone: '1234567890', recipientCountry: 'TZ' })
      ).rejects.toThrow(/transfer limits/);
    });

    it('throws when amount is above transactionMax from DB limits', async () => {
      prisma.transferLimit.findFirst.mockResolvedValue({
        dailyMin: 1, dailyMax: 100000, transactionMin: 1, transactionMax: 100,
        monthlyMax: null, kycRequired: false,
      });
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());

      await expect(
        service.getTransferQuote({ userId: 'u', sendAmount: 5000, sendCurrency: 'KES', recipientPhone: '1234567890', recipientCountry: 'TZ' })
      ).rejects.toThrow(/transfer limits/);
    });

    it('uses default limits when no DB limit record exists', async () => {
      prisma.transferLimit.findFirst.mockResolvedValue(null);

      // Default transactionMax is 5000; total debit will be slightly above 5000 due to fees
      // but the quote should still succeed for a send of 4000
      const quote = await service.getTransferQuote({ userId: 'u', sendAmount: 4000, sendCurrency: 'KES', recipientPhone: '1234567890', recipientCountry: 'TZ' });
      expect(quote.sendAmount).toBe(4000);
    });
  });

  // ── getTransferLimits ────────────────────────────────────────────────────

  describe('getTransferLimits', () => {
    it('returns default limits when no DB record found', async () => {
      prisma.transferLimit.findFirst.mockResolvedValue(null);
      const limits = await service.getTransferLimits('TZ', 'TZS');

      expect(limits.transactionMin).toBe(1);
      expect(limits.transactionMax).toBe(5000);
      expect(limits.dailyMax).toBe(10000);
      expect(limits.kycRequired).toBe(false);
    });

    it('returns DB limits when a record exists', async () => {
      prisma.transferLimit.findFirst.mockResolvedValue({
        dailyMin: 50, dailyMax: 20000, transactionMin: 50, transactionMax: 8000,
        monthlyMax: 100000, kycRequired: true,
      });
      const limits = await service.getTransferLimits('KE', 'KES');

      expect(limits.transactionMin).toBe(50);
      expect(limits.transactionMax).toBe(8000);
      expect(limits.kycRequired).toBe(true);
      expect(limits.monthlyMax).toBe(100000);
    });
  });

  // ── getTransferHistory ───────────────────────────────────────────────────

  describe('getTransferHistory', () => {
    beforeEach(() => {
      prisma.p2PTransfer.findMany.mockResolvedValue([]);
      prisma.p2PTransfer.count.mockResolvedValue(0);
    });

    it('returns paginated result with correct totalPages', async () => {
      prisma.p2PTransfer.count.mockResolvedValue(45);
      const result = await service.getTransferHistory('user-001', { page: 2, limit: 20 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(45);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('filters by status when provided', async () => {
      await service.getTransferHistory('user-001', { status: 'COMPLETED' });

      expect(prisma.p2PTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-001', status: 'COMPLETED' } })
      );
    });

    it('omits status filter when not provided', async () => {
      await service.getTransferHistory('user-001');

      expect(prisma.p2PTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-001' } })
      );
    });

    it('defaults to page 1, limit 20 when options omitted', async () => {
      await service.getTransferHistory('user-001');

      expect(prisma.p2PTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
    });
  });

  // ── getTransferStatus ────────────────────────────────────────────────────

  describe('getTransferStatus', () => {
    it('returns mapped transfer data when found', async () => {
      prisma.p2PTransfer.findUnique.mockResolvedValue({
        transferRef: 'P2P-xyz',
        status: 'COMPLETED',
        sendAmount: 5000,
        sendCurrency: 'KES',
        receiveAmount: 91875,
        receiveCurrency: 'TZS',
        exchangeRate: 19.45,
        recipientPhone: '255712345678',
        recipientCountry: 'TZ',
        recipientName: 'John Doe',
        providerReference: 'TXN-123',
        createdAt: new Date('2026-05-01'),
        completedAt: new Date('2026-05-01'),
        failureReason: null,
      });

      const result = await service.getTransferStatus('P2P-xyz');
      expect(result.transferRef).toBe('P2P-xyz');
      expect(result.status).toBe('COMPLETED');
      expect(result.sendAmount).toBe(5000);
    });

    it('throws when transfer not found', async () => {
      prisma.p2PTransfer.findUnique.mockResolvedValue(null);
      await expect(service.getTransferStatus('MISSING')).rejects.toThrow('Transfer not found');
    });
  });

  // ── recipient management ─────────────────────────────────────────────────

  describe('saveRecipient', () => {
    it('creates new recipient when none exists', async () => {
      prisma.transferRecipient.findFirst.mockResolvedValue(null);
      prisma.transferRecipient.create.mockResolvedValue({ id: 'r-1' });

      await service.saveRecipient({ userId: 'u', name: 'Jane', phoneNumber: '254700000000', country: 'KE', walletType: 'mobile_wallet' });

      expect(prisma.transferRecipient.create).toHaveBeenCalledTimes(1);
      expect(prisma.transferRecipient.update).not.toHaveBeenCalled();
    });

    it('updates existing recipient when phone+country already saved', async () => {
      prisma.transferRecipient.findFirst.mockResolvedValue({ id: 'r-existing' });
      prisma.transferRecipient.update.mockResolvedValue({ id: 'r-existing' });

      await service.saveRecipient({ userId: 'u', name: 'Jane Updated', phoneNumber: '254700000000', country: 'KE', walletType: 'mobile_wallet' });

      expect(prisma.transferRecipient.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r-existing' } })
      );
      expect(prisma.transferRecipient.create).not.toHaveBeenCalled();
    });
  });

  describe('getRecipients', () => {
    it('returns recipients ordered by lastUsedAt then createdAt', async () => {
      const recs = [{ id: 'r-1' }, { id: 'r-2' }];
      prisma.transferRecipient.findMany.mockResolvedValue(recs);

      const result = await service.getRecipients('u');
      expect(result).toBe(recs);
      expect(prisma.transferRecipient.findMany).toHaveBeenCalledWith({
        where: { userId: 'u' },
        orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('deleteRecipient', () => {
    it('deletes scoped to both userId and recipientId', async () => {
      prisma.transferRecipient.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteRecipient('user-001', 'r-001');

      expect(prisma.transferRecipient.deleteMany).toHaveBeenCalledWith({
        where: { id: 'r-001', userId: 'user-001' },
      });
    });
  });

  // ── executeTransfer ──────────────────────────────────────────────────────

  describe('executeTransfer', () => {
    function setupHappyPath() {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());

      (getWalletBalance as jest.Mock).mockResolvedValue({
        balance: 20000,
        availableBalance: 20000,
        pendingBalance: 0,
      });

      prisma.user.findUnique.mockResolvedValue({ phoneNumber: '+254700000000', country: 'KE' });
      prisma.complianceCheck.create.mockResolvedValue({});

      const transfer = makeTransferRecord();
      prisma.$transaction.mockImplementation((ops: unknown) => {
        if (Array.isArray(ops)) {
          // First atomic transaction: [p2PTransfer.create, wallet.updateMany, transaction.create]
          if (ops.length === 3) return Promise.resolve([transfer, {}, {}]);
          // Second update transaction: [p2PTransfer.update, transaction.updateMany]
          return Promise.resolve([{}, {}]);
        }
        return Promise.resolve();
      });

      routingEngine.executePayment.mockResolvedValue({
        success: true,
        providerReference: 'TXN-ABC',
        transactionId: 'txn-001',
        message: 'Payment successful',
      });
    }

    it('completes successfully on happy path', async () => {
      setupHappyPath();

      const result = await service.executeTransfer(makeTransferRequest());

      expect(result.success).toBe(true);
      expect(result.status).toBe('COMPLETED');
      expect(result.providerReference).toBe('TXN-ABC');
    });

    it('throws INSUFFICIENT_FUNDS before any DB writes when balance too low', async () => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());

      (getWalletBalance as jest.Mock).mockResolvedValue({
        balance: 100,
        availableBalance: 100,
        pendingBalance: 0,
      });

      await expect(
        service.executeTransfer(makeTransferRequest())
      ).rejects.toThrow(/Insufficient funds/);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('returns PENDING_REVIEW when compliance risk is HIGH', async () => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());

      (getWalletBalance as jest.Mock).mockResolvedValue({ balance: 99999, availableBalance: 99999, pendingBalance: 0 });
      prisma.user.findUnique.mockResolvedValue({ phoneNumber: '+254700000000', country: 'KE' });
      prisma.complianceCheck.create.mockResolvedValue({});

      const transfer = makeTransferRecord({ status: 'PENDING_REVIEW' });
      prisma.$transaction.mockResolvedValue([transfer, {}, {}]);

      // High-risk country triggers riskScore += 40 → riskLevel HIGH
      const result = await service.executeTransfer(makeTransferRequest({ recipientCountry: 'XX' }));

      expect(result.success).toBe(true);
      expect(result.status).toBe('PENDING_REVIEW');
      // Payment provider should NOT be called for compliance-held transfers
      expect(routingEngine.executePayment).not.toHaveBeenCalled();
    });

    it('throws before wallet debit when compliance fails (sanctions)', async () => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());

      (getWalletBalance as jest.Mock).mockResolvedValue({ balance: 99999, availableBalance: 99999, pendingBalance: 0 });
      prisma.user.findUnique.mockResolvedValue({ phoneNumber: '+254700000000', country: 'KE' });

      // Amount >= 10000 makes amountThreshold: false → passed: false
      prisma.complianceCheck.create.mockResolvedValue({});

      await expect(
        service.executeTransfer(makeTransferRequest({ sendAmount: 10000 }))
      ).rejects.toThrow(/Compliance check failed/);

      // Wallet debit (first $transaction) should not have been called
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('refunds wallet when payment provider returns success: false', async () => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());

      (getWalletBalance as jest.Mock).mockResolvedValue({ balance: 20000, availableBalance: 20000, pendingBalance: 0 });
      prisma.user.findUnique.mockResolvedValue({ phoneNumber: '+254700000000', country: 'KE' });
      prisma.complianceCheck.create.mockResolvedValue({});

      const transfer = makeTransferRecord();
      let transactionCallCount = 0;
      prisma.$transaction.mockImplementation((ops: unknown) => {
        transactionCallCount++;
        if (transactionCallCount === 1) return Promise.resolve([transfer, {}, {}]); // atomic debit
        return Promise.resolve([{}, {}, {}]); // rollback (includes wallet increment)
      });

      routingEngine.executePayment.mockResolvedValue({
        success: false,
        message: 'Provider timeout',
        providerReference: null,
      });

      const result = await service.executeTransfer(makeTransferRequest());

      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.message).toContain('refunded');

      // Second $transaction should include wallet increment (rollback)
      const rollbackCall = prisma.$transaction.mock.calls[1][0];
      expect(rollbackCall.length).toBe(3); // update transfer + update txn + increment wallet
    });

    it('rolls back wallet when payment provider throws an exception', async () => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());

      (getWalletBalance as jest.Mock).mockResolvedValue({ balance: 20000, availableBalance: 20000, pendingBalance: 0 });
      prisma.user.findUnique.mockResolvedValue({ phoneNumber: '+254700000000', country: 'KE' });
      prisma.complianceCheck.create.mockResolvedValue({});

      const transfer = makeTransferRecord();
      let callCount = 0;
      prisma.$transaction.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve([transfer, {}, {}]);
        return Promise.resolve([{}, {}, {}]);
      });

      routingEngine.executePayment.mockRejectedValue(new Error('Network error'));

      const result = await service.executeTransfer(makeTransferRequest());

      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.message).toContain('refunded');
      expect(prisma.$transaction).toHaveBeenCalledTimes(2); // debit + rollback
    });

    it('saves recipient when saveRecipient is true and payment succeeds', async () => {
      setupHappyPath();
      prisma.transferRecipient.findFirst.mockResolvedValue(null);
      prisma.transferRecipient.create.mockResolvedValue({ id: 'r-new' });

      await service.executeTransfer(makeTransferRequest({ saveRecipient: true }));

      expect(prisma.transferRecipient.create).toHaveBeenCalledTimes(1);
    });

    it('does not save recipient when payment fails', async () => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());

      (getWalletBalance as jest.Mock).mockResolvedValue({ balance: 20000, availableBalance: 20000, pendingBalance: 0 });
      prisma.user.findUnique.mockResolvedValue({ phoneNumber: '+254700000000', country: 'KE' });
      prisma.complianceCheck.create.mockResolvedValue({});

      const transfer = makeTransferRecord();
      let callCount = 0;
      prisma.$transaction.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve([transfer, {}, {}]);
        return Promise.resolve([{}, {}, {}]);
      });

      routingEngine.executePayment.mockResolvedValue({ success: false, message: 'Declined' });

      await service.executeTransfer(makeTransferRequest({ saveRecipient: true }));

      expect(prisma.transferRecipient.create).not.toHaveBeenCalled();
    });

    it('creates transaction ledger entry of type P2P_TRANSFER in atomic debit', async () => {
      crossBorderEngine.findOptimalRoute.mockResolvedValue(makeFxResult());
      prisma.transferLimit.findFirst.mockResolvedValue(makeGenLimits());

      (getWalletBalance as jest.Mock).mockResolvedValue({ balance: 20000, availableBalance: 20000, pendingBalance: 0 });
      prisma.user.findUnique.mockResolvedValue({ phoneNumber: '+254700000000', country: 'KE' });
      prisma.complianceCheck.create.mockResolvedValue({});

      const transfer = makeTransferRecord();
      prisma.$transaction.mockImplementation((ops: unknown) => {
        if (Array.isArray(ops) && ops.length === 3) return Promise.resolve([transfer, {}, {}]);
        return Promise.resolve([{}, {}]);
      });
      routingEngine.executePayment.mockResolvedValue({ success: true, providerReference: 'REF', transactionId: 't-1', message: 'ok' });

      await service.executeTransfer(makeTransferRequest());

      // The third element of the first $transaction call is transaction.create
      // We verify transaction.create was invoked with type P2P_TRANSFER
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'P2P_TRANSFER', status: 'PROCESSING' }),
        })
      );
    });
  });
});
