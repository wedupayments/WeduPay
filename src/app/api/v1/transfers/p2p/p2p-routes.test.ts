/**
 * P2P API route unit tests
 *
 * Covers three routes:
 *  - POST /api/v1/transfers/p2p/quote
 *  - POST /api/v1/transfers/p2p
 *  - GET  /api/v1/transfers/p2p/history
 *
 * P2PTransferService and auth helpers are fully mocked.
 *
 * All three route files instantiate `new P2PTransferService()` at module load
 * (before beforeAll). The mock factory must therefore return a working object
 * immediately. We build the service method bag inside the factory and attach it
 * to the mock constructor so tests can retrieve it via
 * `(P2PTransferService as jest.Mock).mock.results[N].value`.
 * Because all three route instances share the same factory, each gets a fresh
 * object but with the same underlying jest.fn() references (see _svc below).
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/services/routing/p2p-transfer-service', () => {
  const getTransferQuote = jest.fn();
  const executeTransfer = jest.fn();
  const getTransferHistory = jest.fn();
  const getTransferLimits = jest.fn();

  const MockP2PTransferService = jest.fn().mockImplementation(() => ({
    getTransferQuote,
    executeTransfer,
    getTransferHistory,
    getTransferLimits,
  }));

  // Attach the fns so tests can grab them via the named export
  MockP2PTransferService._getTransferQuote = getTransferQuote;
  MockP2PTransferService._executeTransfer = executeTransfer;
  MockP2PTransferService._getTransferHistory = getTransferHistory;
  MockP2PTransferService._getTransferLimits = getTransferLimits;

  return { P2PTransferService: MockP2PTransferService };
});

jest.mock('@/lib/auth', () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireAppUser: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { POST as quotePost } from './quote/route';
import { POST as transferPost } from './route';
import { GET as historyGet } from './history/route';
import { NextRequest } from 'next/server';
import { P2PTransferService } from '@/services/routing/p2p-transfer-service';
import * as authLib from '@/lib/auth';

// ── Mock aliases ──────────────────────────────────────────────────────────────

// Retrieve the shared jest.fn() references that the factory embedded on the constructor.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const P2PServiceMock = P2PTransferService as any;
const mockGetTransferQuote: jest.Mock = P2PServiceMock._getTransferQuote;
const mockExecuteTransfer: jest.Mock = P2PServiceMock._executeTransfer;
const mockGetTransferHistory: jest.Mock = P2PServiceMock._getTransferHistory;
const mockGetTransferLimits: jest.Mock = P2PServiceMock._getTransferLimits;

let mockAuthenticateRequest: jest.Mock;
let mockRequireAuth: jest.Mock;
let mockRequireAppUser: jest.Mock;

// Suppress console output from route handlers in tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);

  mockAuthenticateRequest = authLib.authenticateRequest as jest.Mock;
  mockRequireAuth = authLib.requireAuth as jest.Mock;
  mockRequireAppUser = authLib.requireAppUser as jest.Mock;
});

afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function authenticatedAs(userId = 'user-001') {
  const authContext = { userId, appUser: { id: userId } };
  mockAuthenticateRequest.mockResolvedValue(authContext);
  mockRequireAuth.mockReturnValue(null);
  mockRequireAppUser.mockReturnValue(null);
}

function makePostRequest(body: unknown, url = 'http://localhost/api/v1/transfers/p2p') {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeGetRequest(params: Record<string, string> = {}, path = 'http://localhost/api/v1/transfers/p2p/history') {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

const validQuoteBody = {
  sendAmount: 5000,
  sendCurrency: 'KES',
  recipientPhone: '255712345678',
  recipientCountry: 'TZ',
  recipientName: 'John Doe',
};

const validTransferBody = { ...validQuoteBody, saveRecipient: false };

// ── POST /transfers/p2p/quote ─────────────────────────────────────────────────

describe('POST /api/v1/transfers/p2p/quote', () => {
  it('returns 200 with quote and limits on valid request', async () => {
    authenticatedAs();
    mockGetTransferQuote.mockResolvedValue({
      sendAmount: 5000,
      sendCurrency: 'KES',
      receiveAmount: 91875,
      receiveCurrency: 'TZS',
      exchangeRate: 19.45,
      fees: { transferFee: 75, fxFee: 50, totalFees: 125 },
      totalDebit: 5125,
      estimatedDelivery: 'Instant',
      route: { provider: 'flutterwave', fxRoute: 'direct' },
    });
    mockGetTransferLimits.mockResolvedValue({
      transactionMin: 1, transactionMax: 5000, dailyMax: 10000, kycRequired: false,
    });

    const res = await quotePost(makePostRequest(validQuoteBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.quote.receiveAmount).toBe(91875);
    expect(body.quote.fees.totalFees).toBe(125);
    expect(body.limits.kycRequired).toBe(false);
    expect(body.validFor).toBe(600);
  });

  it('returns 400 on negative amount', async () => {
    authenticatedAs();

    const res = await quotePost(makePostRequest({ ...validQuoteBody, sendAmount: -1 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 on invalid currency code length', async () => {
    authenticatedAs();
    const res = await quotePost(makePostRequest({ ...validQuoteBody, sendCurrency: 'DOLLARS' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid country code length', async () => {
    authenticatedAs();
    const res = await quotePost(makePostRequest({ ...validQuoteBody, recipientCountry: 'TZZ' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on phone number too short', async () => {
    authenticatedAs();
    const res = await quotePost(makePostRequest({ ...validQuoteBody, recipientPhone: '12345' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    authenticatedAs();
    mockGetTransferQuote.mockRejectedValue(new Error('No available routes'));

    const res = await quotePost(makePostRequest(validQuoteBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('No available routes');
  });

  it('returns 401 when auth fails', async () => {
    mockAuthenticateRequest.mockResolvedValue({});
    mockRequireAuth.mockReturnValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );

    const res = await quotePost(makePostRequest(validQuoteBody));
    expect(res.status).toBe(401);
  });

  it('passes userId from auth context to service', async () => {
    authenticatedAs('user-xyz');
    mockGetTransferQuote.mockResolvedValue({
      sendAmount: 5000, sendCurrency: 'KES', receiveAmount: 90000, receiveCurrency: 'TZS',
      exchangeRate: 18, fees: { transferFee: 75, fxFee: 50, totalFees: 125 }, totalDebit: 5125,
      estimatedDelivery: 'Instant', route: { provider: 'flutterwave', fxRoute: 'direct' },
    });
    mockGetTransferLimits.mockResolvedValue({ transactionMin: 1, transactionMax: 5000, dailyMax: 10000, kycRequired: false });

    await quotePost(makePostRequest(validQuoteBody));

    expect(mockGetTransferQuote).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-xyz' })
    );
  });
});

// ── POST /transfers/p2p ───────────────────────────────────────────────────────

describe('POST /api/v1/transfers/p2p', () => {
  it('returns 201 with COMPLETED status on successful transfer', async () => {
    authenticatedAs();
    mockExecuteTransfer.mockResolvedValue({
      success: true,
      transferId: 'txfr-001',
      transferRef: 'P2P-1234-abc',
      status: 'COMPLETED',
      message: null,
      recipientPhone: '255712345678',
      recipientCountry: 'TZ',
      receiveAmount: 91875,
      receiveCurrency: 'TZS',
      providerReference: 'TXN-ABC',
      estimatedDelivery: 'Instant',
    });

    const res = await transferPost(makePostRequest(validTransferBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.transfer.status).toBe('COMPLETED');
    expect(body.transfer.reference).toBe('P2P-1234-abc');
    expect(body.recipient.phone).toBe('255712345678');
    expect(body.delivery.providerReference).toBe('TXN-ABC');
  });

  it('returns 201 with PENDING_REVIEW status for compliance-held transfers', async () => {
    authenticatedAs();
    mockExecuteTransfer.mockResolvedValue({
      success: true,
      transferId: 'txfr-002',
      transferRef: 'P2P-pend',
      status: 'PENDING_REVIEW',
      message: 'Transfer submitted and is under compliance review. Funds are held pending approval.',
      recipientPhone: '255712345678',
      recipientCountry: 'TZ',
      receiveAmount: 91875,
      receiveCurrency: 'TZS',
    });

    const res = await transferPost(makePostRequest(validTransferBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.transfer.status).toBe('PENDING_REVIEW');
    expect(body.nextSteps).toContain('Transfer is under compliance review');
  });

  it('returns 400 when service returns success: false (FAILED)', async () => {
    authenticatedAs();
    mockExecuteTransfer.mockResolvedValue({
      success: false,
      transferId: 'txfr-003',
      transferRef: 'P2P-fail',
      status: 'FAILED',
      message: 'Payment failed: Provider timeout. Your funds have been refunded.',
      recipientPhone: '255712345678',
      recipientCountry: 'TZ',
      receiveAmount: 91875,
      receiveCurrency: 'TZS',
    });

    const res = await transferPost(makePostRequest(validTransferBody));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.transfer.status).toBe('FAILED');
  });

  it('returns 500 when service throws INSUFFICIENT_FUNDS', async () => {
    authenticatedAs();
    mockExecuteTransfer.mockRejectedValue(new Error('Insufficient funds. Available: 100.00 KES, required: 5125.00 KES'));

    const res = await transferPost(makePostRequest(validTransferBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Insufficient funds');
  });

  it('returns 500 when service throws a compliance error', async () => {
    authenticatedAs();
    mockExecuteTransfer.mockRejectedValue(new Error('Compliance check failed: HIGH risk'));

    const res = await transferPost(makePostRequest(validTransferBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Compliance check failed');
  });

  it('returns 400 on Zod validation failure', async () => {
    authenticatedAs();

    const res = await transferPost(makePostRequest({
      sendAmount: 0, sendCurrency: 'KES', recipientPhone: '1234567890', recipientCountry: 'TZ',
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation error');
  });

  it('returns correct nextSteps for COMPLETED status', async () => {
    authenticatedAs();
    mockExecuteTransfer.mockResolvedValue({
      success: true, transferId: 't', transferRef: 'P2P-x', status: 'COMPLETED',
      recipientPhone: '255712345678', recipientCountry: 'TZ', receiveAmount: 100, receiveCurrency: 'TZS',
    });

    const res = await transferPost(makePostRequest(validTransferBody));
    const body = await res.json();
    expect(body.nextSteps).toContain('Transfer completed successfully');
    expect(body.nextSteps).toContain('Recipient has received the funds');
  });

  it('returns correct nextSteps for PROCESSING status', async () => {
    authenticatedAs();
    mockExecuteTransfer.mockResolvedValue({
      success: true, transferId: 't', transferRef: 'P2P-x', status: 'PROCESSING',
      recipientPhone: '255712345678', recipientCountry: 'TZ', receiveAmount: 100, receiveCurrency: 'TZS',
    });

    const res = await transferPost(makePostRequest(validTransferBody));
    const body = await res.json();
    expect(body.nextSteps).toContain('Transfer is being processed');
  });
});

// ── GET /transfers/p2p/history ────────────────────────────────────────────────

describe('GET /api/v1/transfers/p2p/history', () => {
  const historyResponse = {
    transfers: [{ transferRef: 'P2P-001', status: 'COMPLETED', sendAmount: 5000 }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };

  it('returns 200 with paginated history', async () => {
    authenticatedAs();
    mockGetTransferHistory.mockResolvedValue(historyResponse);

    const res = await historyGet(makeGetRequest({ page: '1', limit: '20' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.transfers).toHaveLength(1);
    expect(body.pagination.totalPages).toBe(1);
  });

  it('passes page, limit, and status to service', async () => {
    authenticatedAs();
    mockGetTransferHistory.mockResolvedValue({ transfers: [], pagination: { page: 2, limit: 10, total: 0, totalPages: 0 } });

    await historyGet(makeGetRequest({ page: '2', limit: '10', status: 'COMPLETED' }));

    expect(mockGetTransferHistory).toHaveBeenCalledWith('user-001', {
      page: 2,
      limit: 10,
      status: 'COMPLETED',
    });
  });

  it('uses page=1, limit=20 defaults when no params provided', async () => {
    authenticatedAs();
    mockGetTransferHistory.mockResolvedValue({ transfers: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });

    await historyGet(makeGetRequest());

    const [, opts] = mockGetTransferHistory.mock.calls[0];
    expect(opts.page).toBe(1);
    expect(opts.limit).toBe(20);
  });

  it('does not pass status filter when status not in query string', async () => {
    authenticatedAs();
    mockGetTransferHistory.mockResolvedValue({ transfers: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });

    await historyGet(makeGetRequest({ page: '1', limit: '5' }));

    const [, opts] = mockGetTransferHistory.mock.calls[0];
    expect(opts.status).toBeUndefined();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthenticateRequest.mockResolvedValue({});
    mockRequireAuth.mockReturnValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );

    const res = await historyGet(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns 500 on service error', async () => {
    authenticatedAs();
    mockGetTransferHistory.mockRejectedValue(new Error('DB error'));

    const res = await historyGet(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DB error');
  });
});
