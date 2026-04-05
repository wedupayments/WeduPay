/**
 * Brand-config & UI utility unit tests
 *
 * Tests the pure mapping functions used in CardsPage and WalletBalanceCard
 * to ensure correct brand colours, logos, and fallback behaviour.
 *
 * These functions are pure (no side-effects, no async, no DOM) so they
 * run in Node environment without jsdom overhead.
 */

// ─── Brand constants mimicked from the components ─────────────────────────
// (Keeping them here avoids importing JSX components in a node env test)

const WALLET_BRANDS: Record<
  string,
  { accent: string; logo: string; gradient: string }
> = {
  mpesa:   { accent: '#43a047', logo: '/logos/mpesa.png',    gradient: 'linear-gradient(135deg, #1a7c3e 0%, #43a047 60%, #66bb6a 100%)' },
  ecocash: { accent: '#e53935', logo: '/logos/ecocash.png',  gradient: 'linear-gradient(135deg, #b71c1c 0%, #e53935 60%, #ef5350 100%)' },
  mtn:     { accent: '#795548', logo: '/logos/mtn-momo.png', gradient: 'linear-gradient(135deg, #b7840c 0%, #f9a825 60%, #ffd54f 100%)' },
}

const CARD_GRADIENTS: Record<string, string> = {
  Visa:       'linear-gradient(135deg, #1a237e 0%, #283593 45%, #1565c0 100%)',
  Mastercard: 'linear-gradient(135deg, #212121 0%, #37474f 45%, #455a64 100%)',
}

function getWalletBrand(walletType: string) {
  return WALLET_BRANDS[walletType.toLowerCase()] ?? null
}

function getCardGradient(provider: string): string {
  return CARD_GRADIENTS[provider] ?? CARD_GRADIENTS['Visa']
}

function formatCardNumber(lastFour: string): string {
  return `•••• •••• •••• ${lastFour}`
}

function getWalletDisplayName(walletType: string, nickname?: string | null): string {
  if (nickname) return nickname
  return walletType.charAt(0).toUpperCase() + walletType.slice(1)
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Wallet brand config', () => {
  describe('getWalletBrand', () => {
    it('returns M-Pesa brand for "mpesa" (lowercase)', () => {
      const brand = getWalletBrand('mpesa')
      expect(brand).not.toBeNull()
      expect(brand?.accent).toBe('#43a047')
      expect(brand?.logo).toBe('/logos/mpesa.png')
    })

    it('is case-insensitive — accepts MPESA, Mpesa, mpesa', () => {
      expect(getWalletBrand('MPESA')).toBe(getWalletBrand('mpesa'))
      expect(getWalletBrand('Mpesa')).toBe(getWalletBrand('mpesa'))
    })

    it('returns EcoCash brand for "ecocash"', () => {
      const brand = getWalletBrand('ecocash')
      expect(brand?.accent).toBe('#e53935')
      expect(brand?.logo).toBe('/logos/ecocash.png')
    })

    it('EcoCash gradient starts with red', () => {
      expect(getWalletBrand('ecocash')?.gradient).toContain('#b71c1c')
    })

    it('returns MTN brand for "mtn"', () => {
      const brand = getWalletBrand('mtn')
      expect(brand?.logo).toBe('/logos/mtn-momo.png')
      expect(brand?.gradient).toContain('#f9a825')
    })

    it('returns null for unknown wallet types', () => {
      expect(getWalletBrand('paypal')).toBeNull()
      expect(getWalletBrand('')).toBeNull()
      expect(getWalletBrand('unknown_bank')).toBeNull()
    })
  })

  describe('getWalletDisplayName', () => {
    it('returns nickname when provided', () => {
      expect(getWalletDisplayName('mpesa', 'My M-Pesa')).toBe('My M-Pesa')
    })

    it('capitalises walletType when no nickname', () => {
      expect(getWalletDisplayName('mpesa')).toBe('Mpesa')
      expect(getWalletDisplayName('ecocash')).toBe('Ecocash')
    })

    it('uses walletType when nickname is null', () => {
      expect(getWalletDisplayName('mtn', null)).toBe('Mtn')
    })

    it('uses walletType when nickname is empty string', () => {
      // Empty string is falsy — falls through to walletType
      expect(getWalletDisplayName('mtn', '')).toBe('Mtn')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Card brand config', () => {
  describe('getCardGradient', () => {
    it('Visa uses a deep navy gradient', () => {
      const gradient = getCardGradient('Visa')
      expect(gradient).toContain('#1a237e')
      expect(gradient).toContain('#1565c0')
    })

    it('Mastercard uses a dark charcoal gradient', () => {
      const gradient = getCardGradient('Mastercard')
      expect(gradient).toContain('#212121')
      expect(gradient).toContain('#455a64')
    })

    it('falls back to Visa gradient for unknown providers', () => {
      expect(getCardGradient('Amex')).toBe(getCardGradient('Visa'))
      expect(getCardGradient('')).toBe(getCardGradient('Visa'))
    })

    it('Visa and Mastercard have distinct gradients', () => {
      expect(getCardGradient('Visa')).not.toBe(getCardGradient('Mastercard'))
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('formatCardNumber', () => {
  it('masks all but last four digits with bullet groups', () => {
    expect(formatCardNumber('4242')).toBe('•••• •••• •••• 4242')
  })

  it('works with any 4-char last digit string', () => {
    const result = formatCardNumber('9999')
    expect(result.endsWith('9999')).toBe(true)
    expect(result.startsWith('••••')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00')
  })

  it('formats zero balance', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })

  it('formats large amounts with commas', () => {
    expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00')
  })

  it('formats KES (Kenyan Shilling)', () => {
    const result = formatCurrency(5000, 'KES')
    // Intl output can vary by locale — just check it includes the amount
    expect(result).toContain('5,000')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Card status visual logic', () => {
  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      FROZEN: 'Frozen',
      CANCELLED: 'Cancelled',
    }
    return labels[status] ?? status
  }

  function isFrozenOrCancelled(status: string): boolean {
    return status === 'FROZEN' || status === 'CANCELLED'
  }

  it('ACTIVE status renders as Active', () => {
    expect(getStatusLabel('ACTIVE')).toBe('Active')
  })

  it('FROZEN status renders as Frozen', () => {
    expect(getStatusLabel('FROZEN')).toBe('Frozen')
  })

  it('CANCELLED status renders as Cancelled', () => {
    expect(getStatusLabel('CANCELLED')).toBe('Cancelled')
  })

  it('unknown status passes through unchanged', () => {
    expect(getStatusLabel('PENDING')).toBe('PENDING')
  })

  it('isFrozenOrCancelled returns true for FROZEN', () => {
    expect(isFrozenOrCancelled('FROZEN')).toBe(true)
  })

  it('isFrozenOrCancelled returns true for CANCELLED', () => {
    expect(isFrozenOrCancelled('CANCELLED')).toBe(true)
  })

  it('isFrozenOrCancelled returns false for ACTIVE', () => {
    expect(isFrozenOrCancelled('ACTIVE')).toBe(false)
  })
})
