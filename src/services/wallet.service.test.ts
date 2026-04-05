/**
 * WalletService unit tests
 *
 * Tests core wallet logic including updateWallet authorization guard,
 * validateWalletType, createWallet, and getOrCreateWallet behaviour.
 * All repositories are mocked via jest.mock — no DB required.
 */

// ── Mocks (must be top-level before any imports) ───────────────────────────

jest.mock('@/repositories/index', () => ({
  WalletRepository: jest.fn().mockImplementation(() => ({
    findByUserId: jest.fn(),
    findByUserAndType: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateBalance: jest.fn(),
  })),
  LedgerEntryRepository: jest.fn().mockImplementation(() => ({
    getAccountBalance: jest.fn(),
  })),
  UserRepository: jest.fn().mockImplementation(() => ({})),
  TransactionRepository: jest.fn().mockImplementation(() => ({})),
  PaymentRepository: jest.fn().mockImplementation(() => ({})),
  ExchangeRateRepository: jest.fn().mockImplementation(() => ({})),
}))

import { WalletService } from '@/services/index'

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeWallet(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'wal-001',
    userId: 'user-001',
    walletType: 'mpesa',
    currency: 'KES',
    balance: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenantId: null,
    nickname: null,
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('WalletService', () => {
  let service: WalletService
  // Access the internal repo mock through the service instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let walletRepo: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ledgerRepo: any

  beforeEach(() => {
    jest.clearAllMocks()
    service = new WalletService()
    // After creating the service, grab the mocked repo instances it holds internally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletRepo = (service as any).walletRepo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ledgerRepo = (service as any).ledgerRepo
  })

  // ── validateWalletType ────────────────────────────────────────────────

  describe('validateWalletType', () => {
    it.each(['ecocash', 'mpesa', 'mtn', 'airtel', 'card'])(
      'accepts supported type: %s',
      (type) => {
        expect(service.validateWalletType(type)).toBe(true)
      }
    )

    it('is case-insensitive', () => {
      expect(service.validateWalletType('MPESA')).toBe(true)
      expect(service.validateWalletType('EcoCash')).toBe(true)
    })

    it.each(['paypal', 'stripe', 'crypto', ''])(
      'rejects unsupported type: "%s"',
      (type) => {
        expect(service.validateWalletType(type)).toBe(false)
      }
    )
  })

  // ── getUserWallets ────────────────────────────────────────────────────

  describe('getUserWallets', () => {
    it('delegates to walletRepo.findByUserId', async () => {
      walletRepo.findByUserId.mockResolvedValue([makeWallet()])
      const result = await service.getUserWallets('user-001')
      expect(walletRepo.findByUserId).toHaveBeenCalledWith('user-001')
      expect(result).toHaveLength(1)
    })

    it('returns empty array when user has no wallets', async () => {
      walletRepo.findByUserId.mockResolvedValue([])
      const result = await service.getUserWallets('user-001')
      expect(result).toEqual([])
    })
  })

  // ── createWallet ──────────────────────────────────────────────────────

  describe('createWallet', () => {
    it('creates a wallet with zero initial balance by default', async () => {
      walletRepo.create.mockResolvedValue(makeWallet({ balance: 0 }))
      await service.createWallet('user-001', 'mpesa', 'KES')

      expect(walletRepo.create).toHaveBeenCalledWith({
        userId: 'user-001',
        walletType: 'mpesa',
        currency: 'KES',
        balance: 0,
      })
    })

    it('honours a custom initial balance', async () => {
      walletRepo.create.mockResolvedValue(makeWallet({ balance: 500 }))
      await service.createWallet('user-001', 'ecocash', 'USD', 500)

      expect(walletRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ balance: 500 })
      )
    })
  })

  // ── updateWallet ──────────────────────────────────────────────────────

  describe('updateWallet', () => {
    it('throws when wallet is not found', async () => {
      walletRepo.findById.mockResolvedValue(null)

      await expect(
        service.updateWallet('wal-xxx', 'user-001', { nickname: 'My Wallet' })
      ).rejects.toThrow('Wallet not found or access denied')

      expect(walletRepo.update).not.toHaveBeenCalled()
    })

    it('throws when wallet belongs to a different user', async () => {
      walletRepo.findById.mockResolvedValue(makeWallet({ userId: 'other-user' }))

      await expect(
        service.updateWallet('wal-001', 'user-001', { nickname: 'My Wallet' })
      ).rejects.toThrow('Wallet not found or access denied')

      expect(walletRepo.update).not.toHaveBeenCalled()
    })

    it('updates the wallet nickname when authorised', async () => {
      walletRepo.findById.mockResolvedValue(makeWallet())
      walletRepo.update.mockResolvedValue(makeWallet({ nickname: 'Savings' }))

      await service.updateWallet('wal-001', 'user-001', { nickname: 'Savings' })

      expect(walletRepo.update).toHaveBeenCalledWith('wal-001', { nickname: 'Savings' })
    })

    it('allows clearing a nickname by passing empty string', async () => {
      walletRepo.findById.mockResolvedValue(makeWallet({ nickname: 'Old Name' }))
      walletRepo.update.mockResolvedValue(makeWallet({ nickname: '' }))

      await service.updateWallet('wal-001', 'user-001', { nickname: '' })

      expect(walletRepo.update).toHaveBeenCalledWith('wal-001', { nickname: '' })
    })
  })

  // ── getOrCreateWallet ─────────────────────────────────────────────────

  describe('getOrCreateWallet', () => {
    it('returns existing wallet without creating a new one', async () => {
      const existing = makeWallet()
      walletRepo.findByUserAndType.mockResolvedValue(existing)

      const result = await service.getOrCreateWallet('user-001', 'mpesa', 'KES')

      expect(walletRepo.create).not.toHaveBeenCalled()
      expect(result).toBe(existing)
    })

    it('creates a new wallet when none exists', async () => {
      walletRepo.findByUserAndType.mockResolvedValue(null)
      const created = makeWallet()
      walletRepo.create.mockResolvedValue(created)

      const result = await service.getOrCreateWallet('user-001', 'mpesa', 'KES')

      expect(walletRepo.create).toHaveBeenCalledTimes(1)
      expect(result).toBe(created)
    })
  })

  // ── updateBalance ─────────────────────────────────────────────────────

  describe('updateBalance', () => {
    it('delegates to walletRepo.updateBalance', async () => {
      walletRepo.updateBalance.mockResolvedValue(makeWallet({ balance: 1500 }))
      await service.updateBalance('wal-001', 500)
      expect(walletRepo.updateBalance).toHaveBeenCalledWith('wal-001', 500)
    })
  })

  // ── getWalletBalance ──────────────────────────────────────────────────

  describe('getWalletBalance', () => {
    it('delegates to ledgerRepo.getAccountBalance', async () => {
      ledgerRepo.getAccountBalance.mockResolvedValue({ balance: 500 })
      await service.getWalletBalance('wal-001', 'KES')
      expect(ledgerRepo.getAccountBalance).toHaveBeenCalledWith('wal-001', 'KES')
    })
  })
})
