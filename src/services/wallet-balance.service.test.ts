/**
 * wallet-balance.service unit tests
 *
 * Tests: getWalletBalance (find-or-create, pending deduction),
 * fundWallet (validation, atomic increment), withdrawFromWallet
 * (insufficient funds, atomic decrement), lockBalance, releaseBalance,
 * and getTotalBalanceInUSD.
 *
 * All Prisma calls are mocked — no database required.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

// These are declared at module scope so tests can reference them.
// They are populated in beforeEach from the mock instance to avoid hoisting issues.
let walletFindFirst: jest.Mock;
let walletCreate: jest.Mock;
let walletUpdate: jest.Mock;
let walletFindUnique: jest.Mock;
let walletFindMany: jest.Mock;
let p2PTransferFindMany: jest.Mock;
let transactionCreate: jest.Mock;
let transactionUpdateMany: jest.Mock;
let exchangeRateFindFirst: jest.Mock;
let $transaction: jest.Mock;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    wallet: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    p2PTransfer: { findMany: jest.fn() },
    transaction: { create: jest.fn(), updateMany: jest.fn() },
    exchangeRate: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  })),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  getWalletBalance,
  fundWallet,
  withdrawFromWallet,
  lockBalance,
  releaseBalance,
  getTotalBalanceInUSD,
} from './wallet-balance.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeWallet(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'wallet-001',
    userId: 'user-001',
    walletType: 'mobile_wallet',
    currency: 'KES',
    balance: 10000,
    nickname: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';

// PrismaClient is a module-level singleton — capture before clearAllMocks wipes mock.results.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _prismaInstance: any;

beforeAll(() => {
  _prismaInstance = (PrismaClient as jest.Mock).mock.results[0]?.value;
  walletFindFirst = _prismaInstance.wallet.findFirst;
  walletCreate = _prismaInstance.wallet.create;
  walletUpdate = _prismaInstance.wallet.update;
  walletFindUnique = _prismaInstance.wallet.findUnique;
  walletFindMany = _prismaInstance.wallet.findMany;
  p2PTransferFindMany = _prismaInstance.p2PTransfer.findMany;
  transactionCreate = _prismaInstance.transaction.create;
  transactionUpdateMany = _prismaInstance.transaction.updateMany;
  exchangeRateFindFirst = _prismaInstance.exchangeRate.findFirst;
  $transaction = _prismaInstance.$transaction;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── getWalletBalance ──────────────────────────────────────────────────────────

describe('getWalletBalance', () => {
  it('returns balance and availableBalance minus PROCESSING transfers', async () => {
    walletFindFirst.mockResolvedValueOnce(makeWallet({ balance: 10000 }));
    p2PTransferFindMany.mockResolvedValue([{ sendAmount: 2000 }, { sendAmount: 500 }]);

    const result = await getWalletBalance('user-001', 'KES');

    expect(result.balance).toBe(10000);
    expect(result.availableBalance).toBe(7500); // 10000 - 2000 - 500
    expect(result.pendingBalance).toBe(2500);
  });

  it('creates a new wallet when none exists', async () => {
    walletFindFirst.mockResolvedValueOnce(null);
    walletCreate.mockResolvedValue(makeWallet({ balance: 0 }));
    p2PTransferFindMany.mockResolvedValue([]);

    const result = await getWalletBalance('user-001', 'KES');

    expect(walletCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ balance: 0, currency: 'KES' }) })
    );
    expect(result.balance).toBe(0);
    expect(result.availableBalance).toBe(0);
  });

  it('returns availableBalance equal to balance when no PROCESSING transfers', async () => {
    walletFindFirst.mockResolvedValueOnce(makeWallet({ balance: 5000 }));
    p2PTransferFindMany.mockResolvedValue([]);

    const result = await getWalletBalance('user-001', 'KES');
    expect(result.availableBalance).toBe(5000);
    expect(result.pendingBalance).toBe(0);
  });

  it('throws when Prisma fails', async () => {
    walletFindFirst.mockRejectedValue(new Error('DB down'));
    await expect(getWalletBalance('user-001', 'KES')).rejects.toThrow('Failed to get wallet balance');
  });
});

// ── fundWallet ────────────────────────────────────────────────────────────────

describe('fundWallet', () => {
  it('increments wallet balance and creates DEPOSIT transaction atomically', async () => {
    walletFindFirst.mockResolvedValue(makeWallet({ balance: 1000 }));
    const updatedWallet = makeWallet({ balance: 1100 });
    const txn = { id: 'txn-001' };
    $transaction.mockResolvedValue([updatedWallet, txn]);

    const result = await fundWallet({ userId: 'user-001', currency: 'KES', amount: 100, source: 'mobile_money' });

    expect(result.success).toBe(true);
    expect(result.previousBalance).toBe(1000);
    expect(result.newBalance).toBe(1100);
    expect(result.transactionId).toBe('txn-001');
  });

  it('rejects amount <= 0', async () => {
    const result = await fundWallet({ userId: 'user-001', currency: 'KES', amount: 0, source: 'mobile_money' });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_AMOUNT');
  });

  it('rejects amount above max deposit limit (100000)', async () => {
    const result = await fundWallet({ userId: 'user-001', currency: 'KES', amount: 100001, source: 'mobile_money' });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('EXCEEDS_LIMIT');
  });

  it('creates new wallet when none exists before depositing', async () => {
    walletFindFirst.mockResolvedValue(null);
    walletCreate.mockResolvedValue(makeWallet({ balance: 0 }));
    $transaction.mockResolvedValue([makeWallet({ balance: 500 }), { id: 'txn-002' }]);

    const result = await fundWallet({ userId: 'user-001', currency: 'USD', amount: 500, source: 'card' });

    expect(walletCreate).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it('returns DEPOSIT_FAILED when Prisma transaction throws', async () => {
    walletFindFirst.mockResolvedValue(makeWallet());
    $transaction.mockRejectedValue(new Error('Deadlock'));

    const result = await fundWallet({ userId: 'user-001', currency: 'KES', amount: 100, source: 'mobile_money' });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('DEPOSIT_FAILED');
  });
});

// ── withdrawFromWallet ────────────────────────────────────────────────────────

describe('withdrawFromWallet', () => {
  it('decrements balance and creates WITHDRAWAL transaction', async () => {
    const wallet = makeWallet({ balance: 5000 });
    walletFindFirst
      .mockResolvedValueOnce(wallet)  // find wallet for withdrawal
      .mockResolvedValueOnce(wallet); // find wallet inside getWalletBalance
    p2PTransferFindMany.mockResolvedValue([]);
    $transaction.mockResolvedValue([makeWallet({ balance: 4500 }), { id: 'txn-w1' }]);

    const result = await withdrawFromWallet({ userId: 'user-001', currency: 'KES', amount: 500, destination: 'mobile_money' });

    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(4500);
    expect(result.transactionId).toBe('txn-w1');
  });

  it('rejects when wallet not found', async () => {
    walletFindFirst.mockResolvedValue(null);

    const result = await withdrawFromWallet({ userId: 'user-001', currency: 'KES', amount: 100, destination: 'mobile_money' });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('WALLET_NOT_FOUND');
  });

  it('rejects when available balance is insufficient', async () => {
    const wallet = makeWallet({ balance: 200 });
    walletFindFirst
      .mockResolvedValueOnce(wallet)
      .mockResolvedValueOnce(wallet);
    p2PTransferFindMany.mockResolvedValue([]);

    const result = await withdrawFromWallet({ userId: 'user-001', currency: 'KES', amount: 500, destination: 'mobile_money' });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INSUFFICIENT_FUNDS');
  });

  it('rejects amount <= 0', async () => {
    const result = await withdrawFromWallet({ userId: 'user-001', currency: 'KES', amount: -10, destination: 'mobile_money' });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_AMOUNT');
  });

  it('returns WITHDRAWAL_FAILED on Prisma error', async () => {
    const wallet = makeWallet({ balance: 5000 });
    walletFindFirst
      .mockResolvedValueOnce(wallet)
      .mockResolvedValueOnce(wallet);
    p2PTransferFindMany.mockResolvedValue([]);
    $transaction.mockRejectedValue(new Error('Timeout'));

    const result = await withdrawFromWallet({ userId: 'user-001', currency: 'KES', amount: 100, destination: 'mobile_money' });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('WITHDRAWAL_FAILED');
  });
});

// ── lockBalance ───────────────────────────────────────────────────────────────

describe('lockBalance', () => {
  it('creates a BALANCE_LOCK transaction and returns success', async () => {
    walletFindUnique.mockResolvedValue(makeWallet({ balance: 1000 }));
    transactionCreate.mockResolvedValue({ id: 'lock-txn' });

    const result = await lockBalance('wallet-001', 300, 'REF-001');
    expect(result.success).toBe(true);
    expect(transactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'BALANCE_LOCK', status: 'PENDING', amount: -300 }),
      })
    );
  });

  it('fails when wallet not found', async () => {
    walletFindUnique.mockResolvedValue(null);
    const result = await lockBalance('wallet-xxx', 100, 'REF');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Wallet not found');
  });

  it('fails when wallet balance is less than lock amount', async () => {
    walletFindUnique.mockResolvedValue(makeWallet({ balance: 50 }));
    const result = await lockBalance('wallet-001', 100, 'REF');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Insufficient balance to lock');
  });
});

// ── releaseBalance ────────────────────────────────────────────────────────────

describe('releaseBalance', () => {
  it('updates BALANCE_LOCK transaction to COMPLETED', async () => {
    transactionUpdateMany.mockResolvedValue({ count: 1 });

    const result = await releaseBalance('wallet-001', 300, 'REF-001');
    expect(result.success).toBe(true);
    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: { reference: 'LOCK-REF-001', type: 'BALANCE_LOCK', status: 'PENDING' },
      data: { status: 'COMPLETED' },
    });
  });

  it('returns failure on Prisma error', async () => {
    transactionUpdateMany.mockRejectedValue(new Error('Constraint'));
    const result = await releaseBalance('wallet-001', 100, 'REF');
    expect(result.success).toBe(false);
  });
});

// ── getTotalBalanceInUSD ──────────────────────────────────────────────────────

describe('getTotalBalanceInUSD', () => {
  it('returns USD wallet at face value (rate=1)', async () => {
    walletFindMany.mockResolvedValue([makeWallet({ currency: 'USD', balance: 200 })]);
    exchangeRateFindFirst.mockResolvedValue(null);

    const result = await getTotalBalanceInUSD('user-001');
    expect(result.totalUSD).toBeCloseTo(200, 5);
    expect(result.balances[0].currency).toBe('USD');
  });

  it('converts non-USD wallets using exchange rate', async () => {
    walletFindMany.mockResolvedValue([makeWallet({ currency: 'KES', balance: 13000 })]);
    exchangeRateFindFirst.mockResolvedValue({ rate: 130, isValid: true });

    const result = await getTotalBalanceInUSD('user-001');
    // rate is for USD→KES=130, so KES→USD = 1/130 per unit
    const expected = 13000 * (1 / 130);
    expect(result.totalUSD).toBeCloseTo(expected, 5);
  });

  it('skips wallets with zero balance', async () => {
    walletFindMany.mockResolvedValue([
      makeWallet({ currency: 'KES', balance: 0 }),
      makeWallet({ currency: 'USD', balance: 100, id: 'w-2' }),
    ]);
    exchangeRateFindFirst.mockResolvedValue(null);

    const result = await getTotalBalanceInUSD('user-001');
    expect(result.balances).toHaveLength(1);
    expect(result.balances[0].currency).toBe('USD');
  });

  it('returns 0 when user has no wallets', async () => {
    walletFindMany.mockResolvedValue([]);
    const result = await getTotalBalanceInUSD('user-001');
    expect(result.totalUSD).toBe(0);
    expect(result.balances).toHaveLength(0);
  });

  it('throws when Prisma fails', async () => {
    walletFindMany.mockRejectedValue(new Error('DB error'));
    await expect(getTotalBalanceInUSD('user-001')).rejects.toThrow('Failed to get total balance');
  });
});
