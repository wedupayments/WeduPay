/**
 * CardService unit tests
 *
 * Tests the pure-logic methods of CardService without hitting the database.
 * Prisma is fully mocked so these run fast with no external deps.
 */

// ── Mock prisma before any imports resolve ─────────────────────────────────
jest.mock('@/lib/prisma', () => ({
  prisma: {
    virtualCard: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { CardService } from '@/services/card.service'
import { prisma } from '@/lib/prisma'

// ── Helpers ────────────────────────────────────────────────────────────────

const mockPrisma = prisma as jest.Mocked<typeof prisma>

function makeDbCard(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'card-001',
    userId: 'user-001',
    tenantId: null,
    provider: 'Visa',
    cardNumber: 'enc==',
    cardToken: 'tok_abc',
    lastFourDigits: '4242',
    expiryMonth: '06',
    expiryYear: '28',
    cvv: 'enc==',
    status: 'ACTIVE',
    currency: 'USD',
    balance: 0,
    limit: null,
    isVirtual: true,
    nickname: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('CardService', () => {
  let service: CardService

  beforeEach(() => {
    service = new CardService()
    jest.clearAllMocks()
  })

  // ── createCard ────────────────────────────────────────────────────────

  describe('createCard', () => {
    it('creates a Visa card with USD default currency', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)

      const result = await service.createCard({ userId: 'user-001', provider: 'Visa' })

      expect(mockPrisma.virtualCard.create).toHaveBeenCalledTimes(1)
      const createCall = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.provider).toBe('Visa')
      expect(createCall.data.currency).toBe('USD')
      expect(createCall.data.isVirtual).toBe(true)
      expect(createCall.data.status).toBe('ACTIVE')
      expect(result.id).toBe('card-001')
    })

    it('stores supplied currency instead of defaulting to USD', async () => {
      const db = makeDbCard({ currency: 'KES' })
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)

      await service.createCard({ userId: 'user-001', provider: 'Mastercard', currency: 'KES' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      expect(data.currency).toBe('KES')
    })

    it('stores an optional nickname when provided', async () => {
      const db = makeDbCard({ nickname: 'Travel Card' })
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)

      await service.createCard({
        userId: 'user-001',
        provider: 'Visa',
        nickname: 'Travel Card',
      })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      expect(data.nickname).toBe('Travel Card')
    })

    it('stores a spending limit when provided', async () => {
      const db = makeDbCard({ limit: 500 })
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)

      await service.createCard({ userId: 'user-001', provider: 'Visa', limit: 500 })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      expect(data.limit).toBe(500)
    })

    it('generates a lastFourDigits string of exactly 4 characters', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      expect(data.lastFourDigits).toHaveLength(4)
      expect(data.lastFourDigits).toMatch(/^\d{4}$/)
    })

    it('generates a 2-digit expiryMonth padded with leading zero', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      expect(data.expiryMonth).toMatch(/^(0[1-9]|1[0-2])$/)
    })

    it('generates a 2-digit expiryYear 3 years in the future', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      const expectedYear = String(new Date().getFullYear() + 3).slice(-2)
      expect(data.expiryYear).toBe(expectedYear)
    })

    it('generates a cardToken starting with "tok_"', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      expect(data.cardToken).toMatch(/^tok_/)
    })

    it('starts card with zero balance', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      expect(data.balance).toBe(0)
    })
  })

  // ── getUserCards ──────────────────────────────────────────────────────

  describe('getUserCards', () => {
    it('returns an empty array when user has no cards', async () => {
      ;(mockPrisma.virtualCard.findMany as jest.Mock).mockResolvedValue([])
      const result = await service.getUserCards('user-001')
      expect(result).toEqual([])
    })

    it('maps db rows to CardResponse shape', async () => {
      ;(mockPrisma.virtualCard.findMany as jest.Mock).mockResolvedValue([makeDbCard()])
      const [card] = await service.getUserCards('user-001')

      expect(card).toMatchObject({
        id: 'card-001',
        provider: 'Visa',
        lastFourDigits: '4242',
        status: 'ACTIVE',
        currency: 'USD',
        balance: 0,
        isVirtual: true,
      })
    })

    it('includes nickname when present', async () => {
      ;(mockPrisma.virtualCard.findMany as jest.Mock).mockResolvedValue([
        makeDbCard({ nickname: 'Shopping Card' }),
      ])
      const [card] = await service.getUserCards('user-001')
      expect(card.nickname).toBe('Shopping Card')
    })

    it('omits nickname when null in db', async () => {
      ;(mockPrisma.virtualCard.findMany as jest.Mock).mockResolvedValue([makeDbCard({ nickname: null })])
      const [card] = await service.getUserCards('user-001')
      expect(card.nickname).toBeUndefined()
    })

    it('omits limit when null in db', async () => {
      ;(mockPrisma.virtualCard.findMany as jest.Mock).mockResolvedValue([makeDbCard({ limit: null })])
      const [card] = await service.getUserCards('user-001')
      expect(card.limit).toBeUndefined()
    })

    it('returns limit as a number when set in db', async () => {
      ;(mockPrisma.virtualCard.findMany as jest.Mock).mockResolvedValue([makeDbCard({ limit: 250 })])
      const [card] = await service.getUserCards('user-001')
      expect(card.limit).toBe(250)
    })

    it('queries only cards belonging to the given userId', async () => {
      ;(mockPrisma.virtualCard.findMany as jest.Mock).mockResolvedValue([])
      await service.getUserCards('user-xyz')

      expect(mockPrisma.virtualCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-xyz' } })
      )
    })
  })

  // ── getCard ───────────────────────────────────────────────────────────

  describe('getCard', () => {
    it('returns null when card does not exist for user', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(null)
      const result = await service.getCard('bad-id', 'user-001')
      expect(result).toBeNull()
    })

    it('returns a CardResponse when card exists', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(makeDbCard())
      const result = await service.getCard('card-001', 'user-001')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('card-001')
    })
  })

  // ── updateCard ────────────────────────────────────────────────────────

  describe('updateCard', () => {
    it('returns null when card does not belong to user', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(null)
      const result = await service.updateCard('card-001', 'other-user', { status: 'FROZEN' })
      expect(result).toBeNull()
      expect(mockPrisma.virtualCard.update).not.toHaveBeenCalled()
    })

    it('updates status on the found card', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(makeDbCard())
      const updated = makeDbCard({ status: 'FROZEN' })
      ;(mockPrisma.virtualCard.update as jest.Mock).mockResolvedValue(updated)

      const result = await service.updateCard('card-001', 'user-001', { status: 'FROZEN' })

      expect(mockPrisma.virtualCard.update).toHaveBeenCalledWith({
        where: { id: 'card-001' },
        data: { status: 'FROZEN' },
      })
      expect(result?.status).toBe('FROZEN')
    })

    it('updates nickname on the found card', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(makeDbCard())
      const updated = makeDbCard({ nickname: 'Work Card' })
      ;(mockPrisma.virtualCard.update as jest.Mock).mockResolvedValue(updated)

      const result = await service.updateCard('card-001', 'user-001', { nickname: 'Work Card' })

      expect(mockPrisma.virtualCard.update).toHaveBeenCalledWith({
        where: { id: 'card-001' },
        data: { nickname: 'Work Card' },
      })
      expect(result?.nickname).toBe('Work Card')
    })
  })

  // ── deleteCard ────────────────────────────────────────────────────────

  describe('deleteCard', () => {
    it('returns false when card does not exist', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(null)
      const result = await service.deleteCard('card-001', 'user-001')
      expect(result).toBe(false)
    })

    it('soft-deletes by setting status to CANCELLED', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(makeDbCard())
      ;(mockPrisma.virtualCard.update as jest.Mock).mockResolvedValue(makeDbCard({ status: 'CANCELLED' }))

      const result = await service.deleteCard('card-001', 'user-001')

      expect(result).toBe(true)
      expect(mockPrisma.virtualCard.update).toHaveBeenCalledWith({
        where: { id: 'card-001' },
        data: { status: 'CANCELLED' },
      })
    })
  })

  // ── fundCardFromWallet ────────────────────────────────────────────────

  describe('fundCardFromWallet', () => {
    it('returns null when card does not exist', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(null)
      const result = await service.fundCardFromWallet({
        cardId: 'card-001',
        userId: 'user-001',
        amount: 50,
        currency: 'USD',
      })
      expect(result).toBeNull()
    })

    it('returns null when amount is zero or negative', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(makeDbCard())
      ;(mockPrisma.wallet.findFirst as jest.Mock).mockResolvedValue({ id: 'wal-001', balance: 100 })

      const result = await service.fundCardFromWallet({
        cardId: 'card-001',
        userId: 'user-001',
        amount: 0,
        currency: 'USD',
      })
      expect(result).toBeNull()
    })

    it('returns null when wallet balance is insufficient', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(makeDbCard())
      ;(mockPrisma.wallet.findFirst as jest.Mock).mockResolvedValue({ id: 'wal-001', balance: 10 })

      const result = await service.fundCardFromWallet({
        cardId: 'card-001',
        userId: 'user-001',
        amount: 200,
        currency: 'USD',
      })
      expect(result).toBeNull()
    })

    it('executes a Prisma transaction when funding succeeds', async () => {
      ;(mockPrisma.virtualCard.findFirst as jest.Mock).mockResolvedValue(makeDbCard())
      ;(mockPrisma.wallet.findFirst as jest.Mock).mockResolvedValue({ id: 'wal-001', balance: 500 })

      const funded = makeDbCard({ balance: 100 })
      ;(mockPrisma.$transaction as jest.Mock).mockResolvedValue([null, funded, null])

      const result = await service.fundCardFromWallet({
        cardId: 'card-001',
        userId: 'user-001',
        amount: 100,
        currency: 'USD',
      })

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
      expect(result?.balance).toBe(100)
    })
  })

  // ── Internal helpers (via observable side-effects) ────────────────────

  describe('internal card number generation (via createCard)', () => {
    it('produces a 17-digit card number stored as base64 (4-char prefix + 12 random + 1 Luhn)', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      // generateCardNumber = '4000' (4) + 12 random digits + 1 Luhn check digit = 17
      const decoded = Buffer.from(data.cardNumber, 'base64').toString('utf8')
      expect(decoded).toHaveLength(17)
      expect(decoded).toMatch(/^\d{17}$/)
    })

    it('card number always starts with 4000 (Visa-style prefix)', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      const decoded = Buffer.from(data.cardNumber, 'base64').toString('utf8')
      expect(decoded.startsWith('4000')).toBe(true)
    })

    it('CVV is a 3-digit number stored as base64', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const { data } = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0]
      const decoded = Buffer.from(data.cvv, 'base64').toString('utf8')
      expect(decoded).toMatch(/^\d{3}$/)
    })

    it('generates distinct tokens across two calls', async () => {
      const db = makeDbCard()
      ;(mockPrisma.virtualCard.create as jest.Mock).mockResolvedValue(db)

      await service.createCard({ userId: 'user-001', provider: 'Visa' })
      await service.createCard({ userId: 'user-001', provider: 'Visa' })

      const token1 = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[0][0].data.cardToken
      const token2 = (mockPrisma.virtualCard.create as jest.Mock).mock.calls[1][0].data.cardToken
      expect(token1).not.toBe(token2)
    })
  })
})
