/**
 * @jest-environment node
 */
/**
 * API Route unit tests — PATCH /api/cards/[id] and PATCH /api/wallets/[id]
 *
 * Tests the route handlers directly by calling them with mocked Request objects.
 * All external dependencies (auth, services) are mocked.
 */

// ── Mocks (hoisted) ────────────────────────────────────────────────────────

jest.mock('@/lib/auth', () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireAppUser: jest.fn(),
}))

jest.mock('@/services/card.service', () => ({
  cardService: {
    getCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
  },
}))

jest.mock('@/services', () => ({
  walletService: {
    updateWallet: jest.fn(),
  },
}))

jest.mock('@/lib/api-response', () => ({
  createErrorResponse: jest.fn((code: string, message: string, details: unknown, status: number) => ({
    body: { error: { code, message, details }, status },
    status,
  })),
}))

// ── Imports ────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import * as cardRoute from '@/app/api/cards/[id]/route'
import * as walletRoute from '@/app/api/wallets/[id]/route'
import { authenticateRequest, requireAuth, requireAppUser } from '@/lib/auth'
import { cardService } from '@/services/card.service'
import { walletService } from '@/services'

const { PATCH: patchCard, GET: getCard, DELETE: deleteCard } = cardRoute
const { PATCH: patchWallet } = walletRoute

// ── Helpers ────────────────────────────────────────────────────────────────

const mockAuth = authenticateRequest as jest.Mock
const mockRequireAuth = requireAuth as jest.Mock
const mockRequireAppUser = requireAppUser as jest.Mock

function makeAuthedMocks(userId = 'user-001') {
  mockAuth.mockResolvedValue({ userId, user: { id: userId } })
  mockRequireAuth.mockReturnValue(null)
  mockRequireAppUser.mockReturnValue(null)
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: object, method = 'PATCH'): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeCardResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'card-001',
    provider: 'Visa',
    lastFourDigits: '4242',
    expiryMonth: '06',
    expiryYear: '28',
    status: 'ACTIVE',
    currency: 'USD',
    balance: 0,
    isVirtual: true,
    createdAt: new Date(),
    ...overrides,
  }
}

// ── Tests: PATCH /api/cards/[id] ──────────────────────────────────────────

describe('PATCH /api/cards/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    mockRequireAuth.mockReturnValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    )
    const req = makeRequest({ status: 'FROZEN' })
    const res = await patchCard(req, makeParams('card-001'))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid status value', async () => {
    makeAuthedMocks()
    const req = makeRequest({ status: 'INVALID_STATUS' })
    const res = await patchCard(req, makeParams('card-001'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when nickname exceeds 50 characters', async () => {
    makeAuthedMocks()
    const req = makeRequest({ nickname: 'x'.repeat(51) })
    const res = await patchCard(req, makeParams('card-001'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when nickname is empty string (min 1)', async () => {
    makeAuthedMocks()
    const req = makeRequest({ nickname: '' })
    const res = await patchCard(req, makeParams('card-001'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when card not found for this user', async () => {
    makeAuthedMocks()
    ;(cardService.updateCard as jest.Mock).mockResolvedValue(null)
    const req = makeRequest({ status: 'FROZEN' })
    const res = await patchCard(req, makeParams('card-nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 200 and updated card when status update succeeds', async () => {
    makeAuthedMocks()
    ;(cardService.updateCard as jest.Mock).mockResolvedValue(
      makeCardResponse({ status: 'FROZEN' })
    )
    const req = makeRequest({ status: 'FROZEN' })
    const res = await patchCard(req, makeParams('card-001'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.card.status).toBe('FROZEN')
    expect(data.message).toBe('Card updated successfully')
  })

  it('returns 200 and updated card when nickname update succeeds', async () => {
    makeAuthedMocks()
    ;(cardService.updateCard as jest.Mock).mockResolvedValue(
      makeCardResponse({ nickname: 'Travel Card' })
    )
    const req = makeRequest({ nickname: 'Travel Card' })
    const res = await patchCard(req, makeParams('card-001'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.card.nickname).toBe('Travel Card')
  })

  it('passes both cardId and userId to cardService.updateCard', async () => {
    makeAuthedMocks('user-xyz')
    ;(cardService.updateCard as jest.Mock).mockResolvedValue(makeCardResponse())
    const req = makeRequest({ status: 'ACTIVE' })
    await patchCard(req, makeParams('card-abc'))
    expect(cardService.updateCard).toHaveBeenCalledWith('card-abc', 'user-xyz', { status: 'ACTIVE' })
  })
})

// ── Tests: GET /api/cards/[id] ─────────────────────────────────────────────

describe('GET /api/cards/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 404 when card is not found', async () => {
    makeAuthedMocks()
    ;(cardService.getCard as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards/bad-id', { method: 'GET' })
    const res = await getCard(req, makeParams('bad-id'))
    expect(res.status).toBe(404)
  })

  it('returns 200 with card when found', async () => {
    makeAuthedMocks()
    ;(cardService.getCard as jest.Mock).mockResolvedValue(makeCardResponse())
    const req = new NextRequest('http://localhost/api/cards/card-001', { method: 'GET' })
    const res = await getCard(req, makeParams('card-001'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.card.id).toBe('card-001')
  })
})

// ── Tests: DELETE /api/cards/[id] ─────────────────────────────────────────

describe('DELETE /api/cards/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 404 when card does not exist', async () => {
    makeAuthedMocks()
    ;(cardService.deleteCard as jest.Mock).mockResolvedValue(false)
    const req = new NextRequest('http://localhost/api/cards/bad', { method: 'DELETE' })
    const res = await deleteCard(req, makeParams('bad'))
    expect(res.status).toBe(404)
  })

  it('returns 200 on successful cancellation', async () => {
    makeAuthedMocks()
    ;(cardService.deleteCard as jest.Mock).mockResolvedValue(true)
    const req = new NextRequest('http://localhost/api/cards/card-001', { method: 'DELETE' })
    const res = await deleteCard(req, makeParams('card-001'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.message).toMatch(/cancelled/i)
  })
})

// ── Tests: PATCH /api/wallets/[id] ────────────────────────────────────────

describe('PATCH /api/wallets/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    mockRequireAuth.mockReturnValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    )
    const req = makeRequest({ nickname: 'My Wallet' })
    const res = await patchWallet(req, makeParams('wal-001'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when nickname is empty string (min 1)', async () => {
    makeAuthedMocks()
    const req = makeRequest({ nickname: '' })
    const res = await patchWallet(req, makeParams('wal-001'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when nickname exceeds 50 characters', async () => {
    makeAuthedMocks()
    const req = makeRequest({ nickname: 'a'.repeat(51) })
    const res = await patchWallet(req, makeParams('wal-001'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when wallet not found or not owned by user', async () => {
    makeAuthedMocks()
    ;(walletService.updateWallet as jest.Mock).mockRejectedValue(
      new Error('Wallet not found or access denied')
    )
    const req = makeRequest({ nickname: 'Savings' })
    const res = await patchWallet(req, makeParams('wal-bad'))
    expect(res.status).toBe(404)
  })

  it('returns 200 and updated wallet on success', async () => {
    makeAuthedMocks()
    const updatedWallet = { id: 'wal-001', nickname: 'Savings', walletType: 'mpesa' }
    ;(walletService.updateWallet as jest.Mock).mockResolvedValue(updatedWallet)
    const req = makeRequest({ nickname: 'Savings' })
    const res = await patchWallet(req, makeParams('wal-001'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.wallet.nickname).toBe('Savings')
    expect(data.message).toBe('Wallet updated successfully')
  })

  it('passes walletId and userId to walletService.updateWallet', async () => {
    makeAuthedMocks('user-abc')
    ;(walletService.updateWallet as jest.Mock).mockResolvedValue({})
    const req = makeRequest({ nickname: 'Personal' })
    await patchWallet(req, makeParams('wal-xyz'))
    expect(walletService.updateWallet).toHaveBeenCalledWith('wal-xyz', 'user-abc', { nickname: 'Personal' })
  })

  it('accepts a nickname exactly 50 characters long', async () => {
    makeAuthedMocks()
    ;(walletService.updateWallet as jest.Mock).mockResolvedValue({})
    const req = makeRequest({ nickname: 'a'.repeat(50) })
    const res = await patchWallet(req, makeParams('wal-001'))
    expect(res.status).toBe(200)
  })
})
