# FX Currency Converter

## Overview

Real-time currency converter supporting African and international currencies.

## Features

- ✅ Real-time currency conversion
- ✅ Support for 10+ currencies (USD, ZWL, ZAR, KES, NGN, GHS, UGX, TZS, EUR, GBP)
- ✅ Transparent fees and exchange rates
- ✅ Auto-conversion as you type
- ✅ Swap currencies with one click
- ✅ Mobile-responsive design

## Setup

### 1. Seed Exchange Rates

```bash
npm run seed:fx
```

This creates sample exchange rates in the database.

### 2. Access the Converter

Go to: `http://localhost:3000/fx`

## API Endpoints

### Get Exchange Rates

```bash
# Get all rates
GET /api/fx/rates

# Get specific rate
GET /api/fx/rates?from=USD&to=ZWL
```

**Response:**
```json
{
  "success": true,
  "rate": {
    "from": "USD",
    "to": "ZWL",
    "rate": 322.0,
    "inverseRate": 0.0031,
    "source": "manual",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Convert Currency

```bash
GET /api/fx/convert?from=USD&to=ZWL&amount=100
```

**Response:**
```json
{
  "success": true,
  "conversion": {
    "from": "USD",
    "to": "ZWL",
    "amount": 100,
    "convertedAmount": 32200.00,
    "rate": 322.0,
    "fee": 483.00,
    "totalAmount": 32683.00,
    "source": "manual",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Supported Currencies

| Code | Currency | Symbol |
|------|----------|--------|
| USD | US Dollar | $ |
| ZWL | Zimbabwean Dollar | Z$ |
| ZAR | South African Rand | R |
| KES | Kenyan Shilling | KSh |
| NGN | Nigerian Naira | ₦ |
| GHS | Ghanaian Cedi | GH₵ |
| UGX | Ugandan Shilling | USh |
| TZS | Tanzanian Shilling | TSh |
| EUR | Euro | € |
| GBP | British Pound | £ |

## Usage in Code

### Using the Component

```tsx
import { CurrencyConverter } from '@/components/fx/CurrencyConverter';

export default function MyPage() {
  return (
    <div>
      <CurrencyConverter />
    </div>
  );
}
```

### Using the API

```typescript
// Get exchange rate
const response = await fetch('/api/fx/rates?from=USD&to=ZWL');
const data = await response.json();
console.log(data.rate.rate); // 322.0

// Convert currency
const response = await fetch('/api/fx/convert?from=USD&to=ZWL&amount=100');
const data = await response.json();
console.log(data.conversion.convertedAmount); // 32200.00
```

## Fees

- **Spread:** 1% (0.01)
- **Margin:** 0.5% (0.005)
- **Total Fee:** ~1.5% of converted amount

## Updating Exchange Rates

### Manual Update

1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run:

```sql
UPDATE exchange_rates
SET rate = 325.0, 
    "inverseRate" = 1/325.0,
    "updatedAt" = NOW()
WHERE "baseCurrency" = 'USD' 
  AND "targetCurrency" = 'ZWL';
```

### Automated Update (Future)

You can integrate with external APIs like:
- Open Exchange Rates API
- Fixer.io
- CurrencyLayer
- ExchangeRate-API

Example integration:

```typescript
// scripts/update-fx-rates.ts
async function updateRates() {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  const data = await response.json();
  
  for (const [currency, rate] of Object.entries(data.rates)) {
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_targetCurrency_source_provider: {
          baseCurrency: 'USD',
          targetCurrency: currency,
          source: 'api',
          provider: 'exchangerate-api',
        },
      },
      update: {
        rate: rate as number,
        inverseRate: 1 / (rate as number),
        updatedAt: new Date(),
      },
      create: {
        baseCurrency: 'USD',
        targetCurrency: currency,
        rate: rate as number,
        inverseRate: 1 / (rate as number),
        source: 'api',
        provider: 'exchangerate-api',
        isValid: true,
      },
    });
  }
}
```

## Testing

```bash
# Test the converter page
open http://localhost:3000/fx

# Test API endpoints
curl "http://localhost:3000/api/fx/rates?from=USD&to=ZWL"
curl "http://localhost:3000/api/fx/convert?from=USD&to=ZWL&amount=100"
```

## Database Schema

```prisma
model ExchangeRate {
  id             String    @id @default(uuid())
  baseCurrency   String
  targetCurrency String
  rate           Float
  inverseRate    Float
  source         String
  provider       String?
  isValid        Boolean   @default(true)
  validFrom      DateTime  @default(now())
  validUntil     DateTime?
  spread         Float     @default(0)
  margin         Float     @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([baseCurrency, targetCurrency, source, provider])
  @@map("exchange_rates")
}
```

## Future Enhancements

- [ ] Real-time rate updates from external APIs
- [ ] Historical rate charts
- [ ] Rate alerts and notifications
- [ ] Favorite currency pairs
- [ ] Multi-currency wallet integration
- [ ] Rate comparison across providers
- [ ] Offline mode with cached rates

---

**The FX converter is now ready to use!**
