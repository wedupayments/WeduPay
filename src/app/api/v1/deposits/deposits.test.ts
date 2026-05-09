/**
 * Deposits API route unit tests
 *
 * Covers:
 *  - POST /api/v1/deposits          (initiate deposit)
 *  - GET  /api/v1/deposits/[id]     (poll status)
 *  - POST /api/v1/deposits/predict  (provider prediction)
 *
 * pawapayAPI, prisma, and auth helpers are fully mocked — no network calls.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/pawapay', () => {
  const predictProvider = jest.fn();
  const initiateDeposit = jest.fn();
  const getDepositStatus = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockPawaPayAPI: any = jest.fn().mockImplementation(() => ({
    predictProvider,
    initiateDeposit,
    getDepositStatus,
  }));

  // The routes import `pawapayAPI` (the singleton), not the class.
  // Mock it as a plain object with the same methods.
  return {
    PawaPayAPI: MockPawaPayAPI,
    pawapayAPI: {
      predictProvider,
      initiateDeposit,
      getDepositStatus,
    },
  };
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: { create: jest.fn() },
  },
}));

jest.mock('@/lib/auth', () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireAppUser: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { POST as depositPost } from './route';
import { GET as statusGet } from './[depositId]/route';
import { POST as predictPost } from './predict/route';
import { NextRequest } from 'next/server';
import { pawapayAPI } from '@/lib/pawapay';
import { prisma } from '@/lib/prisma';
import * as authLib from '@/lib/auth';

// ── Mock aliases ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPawapay = pawapayAPI as any;
const mockInitiateDeposit: jest.Mock = mockPawapay.initiateDeposit;
const mockGetDepositStatus: jest.Mock = mockPawapay.getDepositStatus;
const mockPredictProvider: jest.Mock = mockPawapay.predictProvider;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTransactionCreate: jest.Mock = (prisma as any).transaction.create;

let mockAuthenticateRequest: jest.Mock;
let mockRequireAuth: jest.Mock;
let mockRequireAppUser: jest.Mock;

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
  mockAuthenticateRequest.mockResolvedValue({ userId, appUser: { id: userId } });
  mockRequireAuth.mockReturnValue(null);
  mockRequireAppUser.mockReturnValue(null);
}

function makePost(body: unknown, url: string) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeGet(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

const validDepositBody = {
  phoneNumber: '254712345678',
  amount: 500,
  currency: 'KES',
  description: 'Test deposit',
};

// ── POST /deposits ─────────────────────────────────────────────────────────────

describe('POST /api/v1/deposits', () => {
  it('returns 202 with depositId on successful initiation', async () => {
    authenticatedAs();
    mockInitiateDeposit.mockResolvedValue({
      status: 'PENDING',
      transactionId: 'dep-uuid-001',
      provider: 'MPESA_KE',
    });
    mockTransactionCreate.mockResolvedValue({ id: 'txn-001' });

    const res = await depositPost(makePost(validDepositBody, 'http://localhost/api/v1/deposits'));
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body.success).toBe(true);
    expect(body.depositId).toBe('dep-uuid-001');
    expect(body.status).toBe('PENDING');
    expect(body.provider).toBe('MPESA_KE');
  });

  it('persists a FUNDING transaction record after initiation', async () => {
    authenticatedAs('user-abc');
    mockInitiateDeposit.mockResolvedValue({
      status: 'PENDING',
      transactionId: 'dep-uuid-002',
      provider: 'MPESA_KE',
    });
    mockTransactionCreate.mockResolvedValue({ id: 'txn-002' });

    await depositPost(makePost(validDepositBody, 'http://localhost/api/v1/deposits'));

    expect(mockTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-abc',
          amount: 500,
          currency: 'KES',
          type: 'FUNDING',
          status: 'PENDING',
        }),
      })
    );
  });

  it('returns 502 when PawaPay returns FAILED', async () => {
    authenticatedAs();
    mockInitiateDeposit.mockResolvedValue({
      status: 'FAILED',
      message: 'Invalid phone number',
    });

    const res = await depositPost(makePost(validDepositBody, 'http://localhost/api/v1/deposits'));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid phone number');
    expect(mockTransactionCreate).not.toHaveBeenCalled();
  });

  it('returns 400 on missing required fields', async () => {
    authenticatedAs();
    const res = await depositPost(makePost({ amount: 100 }, 'http://localhost/api/v1/deposits'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 on non-positive amount', async () => {
    authenticatedAs();
    const res = await depositPost(
      makePost({ ...validDepositBody, amount: -50 }, 'http://localhost/api/v1/deposits')
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid currency code length', async () => {
    authenticatedAs();
    const res = await depositPost(
      makePost({ ...validDepositBody, currency: 'DOLLARS' }, 'http://localhost/api/v1/deposits')
    );
    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthenticateRequest.mockResolvedValue({});
    mockRequireAuth.mockReturnValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );

    const res = await depositPost(makePost(validDepositBody, 'http://localhost/api/v1/deposits'));
    expect(res.status).toBe(401);
  });

  it('returns 500 when PawaPay throws', async () => {
    authenticatedAs();
    mockInitiateDeposit.mockRejectedValue(new Error('Network timeout'));

    const res = await depositPost(makePost(validDepositBody, 'http://localhost/api/v1/deposits'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Network timeout');
  });

  it('passes optional provider and country to pawapayAPI', async () => {
    authenticatedAs();
    mockInitiateDeposit.mockResolvedValue({ status: 'PENDING', transactionId: 'dep-003', provider: 'MPESA_KE' });
    mockTransactionCreate.mockResolvedValue({ id: 'txn-003' });

    await depositPost(
      makePost(
        { ...validDepositBody, provider: 'MPESA_KE', country: 'KE' },
        'http://localhost/api/v1/deposits'
      )
    );

    expect(mockInitiateDeposit).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'MPESA_KE', country: 'KE' })
    );
  });
});

// ── GET /deposits/[depositId] ─────────────────────────────────────────────────

describe('GET /api/v1/deposits/[depositId]', () => {
  function makeStatusRequest(depositId: string) {
    const req = makeGet(`/api/v1/deposits/${depositId}`);
    return { req, params: Promise.resolve({ depositId }) };
  }

  it('returns 200 with deposit status on success', async () => {
    authenticatedAs();
    mockGetDepositStatus.mockResolvedValue({
      success: true,
      status: 'SUCCESS',
      transactionId: 'dep-uuid-001',
      amount: 500,
      currency: 'KES',
      provider: 'MPESA_KE',
      providerReference: 'TXN-ABC123',
      transactionDate: '2026-05-09T10:00:00Z',
    });

    const { req, params } = makeStatusRequest('dep-uuid-001');
    const res = await statusGet(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe('SUCCESS');
    expect(body.depositId).toBe('dep-uuid-001');
    expect(body.amount).toBe(500);
    expect(body.provider).toBe('MPESA_KE');
    expect(body.providerReference).toBe('TXN-ABC123');
  });

  it('returns PENDING status while awaiting confirmation', async () => {
    authenticatedAs();
    mockGetDepositStatus.mockResolvedValue({
      success: false,
      status: 'PENDING',
      transactionId: 'dep-uuid-002',
    });

    const { req, params } = makeStatusRequest('dep-uuid-002');
    const res = await statusGet(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('PENDING');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthenticateRequest.mockResolvedValue({});
    mockRequireAuth.mockReturnValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );

    const { req, params } = makeStatusRequest('dep-uuid-003');
    const res = await statusGet(req, { params });
    expect(res.status).toBe(401);
  });

  it('returns 500 when PawaPay throws', async () => {
    authenticatedAs();
    mockGetDepositStatus.mockRejectedValue(new Error('API unavailable'));

    const { req, params } = makeStatusRequest('dep-uuid-004');
    const res = await statusGet(req, { params });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('API unavailable');
  });

  it('calls getDepositStatus with the correct depositId', async () => {
    authenticatedAs();
    mockGetDepositStatus.mockResolvedValue({ success: true, status: 'SUCCESS', transactionId: 'dep-xyz' });

    const { req, params } = makeStatusRequest('dep-xyz');
    await statusGet(req, { params });

    expect(mockGetDepositStatus).toHaveBeenCalledWith('dep-xyz');
  });
});

// ── POST /deposits/predict ────────────────────────────────────────────────────

describe('POST /api/v1/deposits/predict', () => {
  it('returns 200 with provider on success', async () => {
    authenticatedAs();
    mockPredictProvider.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'MPESA_KE',
      country: 'KE',
    });

    const res = await predictPost(makePost({ phoneNumber: '254712345678' }, 'http://localhost/api/v1/deposits/predict'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.provider).toBe('MPESA_KE');
    expect(body.country).toBe('KE');
  });

  it('returns 422 when provider cannot be determined', async () => {
    authenticatedAs();
    mockPredictProvider.mockResolvedValue({
      status: 'FAILED',
      message: 'No provider found for MSISDN',
    });

    const res = await predictPost(makePost({ phoneNumber: '999999999' }, 'http://localhost/api/v1/deposits/predict'));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error).toContain('No provider found');
  });

  it('passes optional country to predictProvider', async () => {
    authenticatedAs();
    mockPredictProvider.mockResolvedValue({ status: 'SUCCESS', provider: 'MTN_GH', country: 'GH' });

    await predictPost(makePost({ phoneNumber: '233501234567', country: 'GH' }, 'http://localhost/api/v1/deposits/predict'));

    expect(mockPredictProvider).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: '233501234567', country: 'GH' })
    );
  });

  it('returns 400 on missing phoneNumber', async () => {
    authenticatedAs();
    const res = await predictPost(makePost({}, 'http://localhost/api/v1/deposits/predict'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 on phone number too short', async () => {
    authenticatedAs();
    const res = await predictPost(makePost({ phoneNumber: '12345' }, 'http://localhost/api/v1/deposits/predict'));
    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthenticateRequest.mockResolvedValue({});
    mockRequireAuth.mockReturnValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );

    const res = await predictPost(makePost({ phoneNumber: '254712345678' }, 'http://localhost/api/v1/deposits/predict'));
    expect(res.status).toBe(401);
  });

  it('returns 500 when PawaPay throws', async () => {
    authenticatedAs();
    mockPredictProvider.mockRejectedValue(new Error('Timeout'));

    const res = await predictPost(makePost({ phoneNumber: '254712345678' }, 'http://localhost/api/v1/deposits/predict'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Timeout');
  });
});
