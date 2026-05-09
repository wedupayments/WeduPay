/**
 * CrossBorderRoutingEngine unit tests
 *
 * Tests: rate caching, same-currency short-circuit, DB-first rate lookup,
 * market-rate fallback, WEDUPAY_INTERNAL fallback routes when no DB providers
 * exist, findAllRoutes provider selection, and cache management.
 *
 * All Prisma and Open Exchange Rates calls are mocked.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@prisma/client', () => {
  const paymentProviderFindMany = jest.fn();
  const paymentProviderFindUnique = jest.fn();
  const exchangeRateFindFirst = jest.fn();

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      paymentProvider: {
        findMany: paymentProviderFindMany,
        findUnique: paymentProviderFindUnique,
      },
      exchangeRate: {
        findFirst: exchangeRateFindFirst,
      },
    })),
  };
});

jest.mock('@/services/routing/money-routing-engine', () => ({
  MoneyRoutingEngine: jest.fn().mockImplementation(() => ({
    executePayment: jest.fn(),
  })),
}));

jest.mock('@/lib/open-exchange-rates', () => ({
  ensureOpenExchangeRatesFresh: jest.fn().mockResolvedValue(true),
  getOpenExchangeRatePair: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { CrossBorderRoutingEngine } from './cross-border-routing';
import { PrismaClient } from '@prisma/client';
import { getOpenExchangeRatePair } from '@/lib/open-exchange-rates';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDbRate(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    rate: 130,
    inverseRate: 1 / 130,
    source: 'market',
    spread: 0.02,
    margin: 0.01,
    provider: null,
    validUntil: new Date(Date.now() + 5 * 60 * 1000),
    isValid: true,
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeProvider(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'provider-001',
    name: 'flutterwave',
    isActive: true,
    supportedCountries: ['TZ', 'KE', 'GH'],
    supportedCurrencies: ['KES', 'TZS', 'USD', 'GHS'],
    feePercentage: 1.5,
    feeFixed: 0,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CrossBorderRoutingEngine', () => {
  let engine: CrossBorderRoutingEngine;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  // PrismaClient is instantiated at module load (const prisma = new PrismaClient()).
  // mock.instances[0] is the raw `this`, which is the same object as mock.results[0].value
  // for class mocks. Capture before clearAllMocks (which clears results but not instances).
  beforeAll(() => {
    // Instances array is populated even after clearAllMocks — safe to use.
    // For jest.fn().mockImplementation(() => ({...})), the returned object lives on results.
    // Access it before clearAllMocks runs.
    const firstResult = (PrismaClient as jest.Mock).mock.results[0];
    prisma = firstResult?.value;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new CrossBorderRoutingEngine();
  });

  // ── getExchangeRate: same currency ────────────────────────────────────────

  describe('getExchangeRate', () => {
    it('returns rate of 1 for same-currency pair without hitting DB', async () => {
      const rate = await engine.getExchangeRate('USD', 'USD');
      expect(rate.rate).toBe(1);
      expect(rate.effectiveRate).toBe(1);
      expect(prisma.exchangeRate.findFirst).not.toHaveBeenCalled();
    });

    it('fetches rate from DB on first call', async () => {
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 130, spread: 0.02, margin: 0.01 }));

      const rate = await engine.getExchangeRate('USD', 'KES');
      expect(rate.rate).toBe(130);
      expect(rate.effectiveRate).toBeCloseTo(130 * (1 - 0.02 - 0.01), 5);
      expect(prisma.exchangeRate.findFirst).toHaveBeenCalledTimes(1);
    });

    it('serves cached rate on second call without hitting DB again', async () => {
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate());

      await engine.getExchangeRate('USD', 'KES');
      await engine.getExchangeRate('USD', 'KES');

      expect(prisma.exchangeRate.findFirst).toHaveBeenCalledTimes(1);
    });

    it('falls back to Open Exchange Rates when no DB record exists', async () => {
      prisma.exchangeRate.findFirst.mockResolvedValue(null);
      (getOpenExchangeRatePair as jest.Mock).mockResolvedValue({ rate: 128.5 });

      const rate = await engine.getExchangeRate('USD', 'KES');
      expect(rate.rate).toBe(128.5);
      expect(getOpenExchangeRatePair).toHaveBeenCalledWith('USD', 'KES');
    });

    it('throws when no DB rate and Open Exchange Rates returns null', async () => {
      prisma.exchangeRate.findFirst.mockResolvedValue(null);
      (getOpenExchangeRatePair as jest.Mock).mockResolvedValue(null);

      await expect(engine.getExchangeRate('USD', 'ZZZ')).rejects.toThrow(/No exchange rate available/);
    });
  });

  // ── cache management ──────────────────────────────────────────────────────

  describe('cache management', () => {
    it('getCacheSize returns 0 before any rate lookups', () => {
      expect(engine.getCacheSize()).toBe(0);
    });

    it('getCacheSize increments after a lookup', async () => {
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate());
      await engine.getExchangeRate('USD', 'KES');
      expect(engine.getCacheSize()).toBe(1);
    });

    it('clearCache empties the cache', async () => {
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate());
      await engine.getExchangeRate('USD', 'KES');
      engine.clearCache();
      expect(engine.getCacheSize()).toBe(0);
    });

    it('re-fetches from DB after cache is cleared', async () => {
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate());

      await engine.getExchangeRate('USD', 'KES');
      engine.clearCache();
      await engine.getExchangeRate('USD', 'KES');

      expect(prisma.exchangeRate.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  // ── findOptimalRoute: WEDUPAY_INTERNAL fallback ───────────────────────────

  describe('findOptimalRoute — fallback routing', () => {
    it('uses WEDUPAY_INTERNAL when no DB providers cover the corridor', async () => {
      prisma.paymentProvider.findMany.mockResolvedValue([]); // no providers
      prisma.paymentProvider.findUnique.mockResolvedValue(null);
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 19.45 }));

      const result = await engine.findOptimalRoute({
        sourceAmount: 5000,
        sourceCurrency: 'KES',
        targetCurrency: 'TZS',
        destinationCountry: 'TZ',
      });

      expect(result.bestRoute.route.provider).toBe('WEDUPAY_INTERNAL');
      expect(result.allRoutes.length).toBeGreaterThan(0);
    });

    it('chooses direct fxRoute when source or target is USD', async () => {
      prisma.paymentProvider.findMany.mockResolvedValue([]);
      prisma.paymentProvider.findUnique.mockResolvedValue(null);
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 130 }));

      const result = await engine.findOptimalRoute({
        sourceAmount: 100,
        sourceCurrency: 'USD',
        targetCurrency: 'KES',
        destinationCountry: 'KE',
      });

      expect(result.bestRoute.route.fxRoute).toBe('direct');
    });

    it('chooses via_usd fxRoute when neither currency is USD/EUR', async () => {
      prisma.paymentProvider.findMany.mockResolvedValue([]);
      prisma.paymentProvider.findUnique.mockResolvedValue(null);
      // Two leg rates: KES→USD and USD→TZS
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 0.0077 }));

      const result = await engine.findOptimalRoute({
        sourceAmount: 5000,
        sourceCurrency: 'KES',
        targetCurrency: 'TZS',
        destinationCountry: 'TZ',
      });

      expect(result.bestRoute.route.fxRoute).toBe('via_usd');
    });

    it('never throws "No available routes" when providers table is empty', async () => {
      prisma.paymentProvider.findMany.mockResolvedValue([]);
      prisma.paymentProvider.findUnique.mockResolvedValue(null);
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 5.2 }));

      await expect(
        engine.findOptimalRoute({ sourceAmount: 1000, sourceCurrency: 'GHS', targetCurrency: 'NGN', destinationCountry: 'NG' })
      ).resolves.not.toThrow();
    });
  });

  // ── findOptimalRoute: with DB providers ───────────────────────────────────

  describe('findOptimalRoute — with DB providers', () => {
    it('includes provider routes when providers support the corridor', async () => {
      const provider = makeProvider();
      prisma.paymentProvider.findMany.mockResolvedValue([provider]);
      prisma.paymentProvider.findUnique.mockResolvedValue(provider);
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 19.45 }));

      const result = await engine.findOptimalRoute({
        sourceAmount: 5000,
        sourceCurrency: 'KES',
        targetCurrency: 'TZS',
        destinationCountry: 'TZ',
      });

      expect(result.allRoutes.some(r => r.route.provider === 'flutterwave')).toBe(true);
    });

    it('picks the route with highest recipientGets as bestRoute', async () => {
      const provider = makeProvider();
      prisma.paymentProvider.findMany.mockResolvedValue([provider]);
      prisma.paymentProvider.findUnique.mockResolvedValue(provider);
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 19.45 }));

      const result = await engine.findOptimalRoute({
        sourceAmount: 5000,
        sourceCurrency: 'KES',
        targetCurrency: 'TZS',
        destinationCountry: 'TZ',
      });

      const best = result.bestRoute;
      for (const alt of result.allRoutes) {
        expect(best.recipientGets).toBeGreaterThanOrEqual(alt.recipientGets);
      }
    });

    it('returns savings.amount = 0 when there is only one route', async () => {
      const provider = makeProvider({ supportedCurrencies: ['KES', 'TZS'] }); // no USD → only direct route
      prisma.paymentProvider.findMany.mockResolvedValue([provider]);
      prisma.paymentProvider.findUnique.mockResolvedValue(provider);
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 19.45 }));

      const result = await engine.findOptimalRoute({
        sourceAmount: 5000,
        sourceCurrency: 'KES',
        targetCurrency: 'TZS',
        destinationCountry: 'TZ',
      });

      expect(result.savings.amount).toBe(0);
      expect(result.savings.percentage).toBe(0);
    });
  });

  // ── recommendation string ─────────────────────────────────────────────────

  describe('recommendation', () => {
    it('contains provider name and exchange rate in output string', async () => {
      prisma.paymentProvider.findMany.mockResolvedValue([]);
      prisma.paymentProvider.findUnique.mockResolvedValue(null);
      prisma.exchangeRate.findFirst.mockResolvedValue(makeDbRate({ rate: 19.45 }));

      const result = await engine.findOptimalRoute({
        sourceAmount: 5000,
        sourceCurrency: 'KES',
        targetCurrency: 'TZS',
        destinationCountry: 'TZ',
      });

      expect(result.recommendation).toContain('WEDUPAY_INTERNAL');
      expect(result.recommendation).toContain('KES');
      expect(result.recommendation).toContain('TZS');
    });
  });
});
