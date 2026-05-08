# African Mobile Money Integration Guide

## Overview

WeduPay now supports **20+ African mobile money providers** across **30+ African countries**, enabling seamless cross-border payments throughout the continent.

## Rail Strategy

WeduPay uses two primary mobile-money rails:

- **Zimbabwe:** direct official EcoCash API access for EcoCash collections, status checks, refunds, and callbacks.
- **Regional Africa:** PawaPay as the aggregator rail for supported non-Zimbabwe mobile-money markets.

Paynow is not part of the active architecture because WeduPay has access to the official EcoCash API.

---

## Supported Regions & Providers

### 🌍 East Africa

| Provider | Countries | Status |
|----------|-----------|--------|
| **M-Pesa Kenya** | Kenya | ✅ Complete |
| **M-Pesa Tanzania** | Tanzania | ✅ Complete |
| **Tigo Pesa** | Tanzania | ✅ Complete |
| **Airtel Money** | Kenya, Tanzania, Uganda, Zambia, DRC | ✅ Complete |
| **MTN Mobile Money** | Uganda, Tanzania | ✅ Complete |

### 🌍 West Africa

#### Anglophone Countries
| Provider | Countries | Status |
|----------|-----------|--------|
| **Paystack** | Nigeria, Ghana | ✅ Complete |
| **Flutterwave** | Nigeria, Ghana | ✅ Complete |
| **OPay** | Nigeria | ✅ Complete |
| **PalmPay** | Nigeria, Ghana | ✅ Complete |

#### Francophone Countries
| Provider | Countries | Status |
|----------|-----------|--------|
| **Orange Money** | Senegal, Ivory Coast, Mali, Burkina Faso | ✅ Complete |
| **Wave** | Senegal, Ivory Coast, Mali, Burkina Faso | ✅ Complete |
| **Moov Money** | Benin, Togo, Ivory Coast, Niger | ✅ Complete |

### 🌍 Southern Africa

| Provider | Countries | Status |
|----------|-----------|--------|
| **EcoCash** | Zimbabwe | ✅ Complete |
| **Telecel Cash** | Zimbabwe | ✅ Complete |
| **Zamtel Money** | Zambia | ✅ Complete |
| **Halopesa** | Mozambique | ✅ Complete |
| **M-Pesa Mozambique** | Mozambique | ✅ Via MTN Adapter |

### 🌍 Central Africa

| Provider | Countries | Status |
|----------|-----------|--------|
| **MTN Mobile Money** | Cameroon, DRC, Gabon | ✅ Complete |
| **Orange Money** | Cameroon, DRC | ✅ Complete |
| **Moov Money** | Gabon, CAR, Chad | ✅ Complete |

### 🌍 Pan-African Aggregators

| Provider | Coverage | Status |
|----------|----------|--------|
| **PawaPay** | Regional mobile money markets outside Zimbabwe | ✅ Complete |
| **Flutterwave** | 15+ countries | ✅ Complete |
| **Africa's Talking** | 5+ countries | ✅ Complete |

---

## Quick Start

### 1. Install Dependencies

All adapters are included in the project. No additional installation required.

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure your provider credentials:

```bash
cp .env.example .env.local
```

### 3. Using the Unified Wallet Factory

```typescript
import { AfricanWalletFactory, WalletType } from '@/src/services/wallets/unified-wallet-factory';

// Create a wallet adapter
const wallet = AfricanWalletFactory.createWallet({
  type: WalletType.MPESA,
  country: 'KE',
  environment: 'sandbox', // or 'live'
});

// Initiate payment
const result = await wallet.initiatePayment({
  phoneNumber: '+254712345678',
  amount: 1000,
  currency: 'KES',
  reference: 'ORDER-123456',
  description: 'Payment for order #123456',
  callbackUrl: 'https://yourdomain.com/api/webhooks/mpesa',
});

// Check transaction status
const status = await wallet.getTransactionStatus(result.transactionId!);

// Process refund (if supported)
const refund = await wallet.refundPayment({
  transactionId: result.transactionId!,
  amount: 1000,
  reason: 'Customer requested refund',
});
```

---

## Provider-Specific Examples

### M-Pesa Kenya

```typescript
import { AfricanWalletFactory, WalletType } from '@/src/services/wallets/unified-wallet-factory';

const mpesa = AfricanWalletFactory.createWallet({
  type: WalletType.MPESA,
  country: 'KE',
});

const result = await mpesa.initiatePayment({
  phoneNumber: '254712345678',
  amount: 500,
  currency: 'KES',
  reference: `MPESA-${Date.now()}`,
  description: 'Test payment',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mpesa`,
});
```

**Environment Variables Required:**
```env
MPESA_CONSUMER_KEY="your-consumer-key"
MPESA_CONSUMER_SECRET="your-consumer-secret"
MPESA_SHORT_CODE="600000"
MPESA_PASSKEY="your-passkey"
```

---

### Flutterwave (Pan-African)

```typescript
import { AfricanWalletFactory, WalletType } from '@/src/services/wallets/unified-wallet-factory';

const flutterwave = AfricanWalletFactory.createWallet({
  type: WalletType.FLUTTERWAVE,
  country: 'NG',
});

const result = await flutterwave.initiatePayment({
  phoneNumber: '2348012345678',
  email: 'customer@example.com',
  amount: 10000,
  currency: 'NGN',
  reference: `FLW-${Date.now()}`,
  description: 'Payment for services',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/flutterwave`,
});

// Flutterwave returns a payment link
if (result.paymentUrl) {
  // Redirect customer to payment page
  res.redirect(result.paymentUrl);
}
```

**Environment Variables Required:**
```env
FLUTTERWAVE_PUBLIC_KEY="your-public-key"
FLUTTERWAVE_SECRET_KEY="your-secret-key"
```

---

### Orange Money (Francophone West Africa)

```typescript
import { AfricanWalletFactory, WalletType } from '@/src/services/wallets/unified-wallet-factory';

const orangeMoney = AfricanWalletFactory.createWallet({
  type: WalletType.ORANGE_MONEY,
  country: 'SN', // Senegal
});

const result = await orangeMoney.initiatePayment({
  phoneNumber: '221771234567',
  amount: 5000,
  currency: 'XOF',
  reference: `OM-${Date.now()}`,
  description: 'E-commerce payment',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/orange-money`,
});

// Orange Money returns a payment URL for web payments
if (result.paymentUrl) {
  res.redirect(result.paymentUrl);
}
```

**Environment Variables Required:**
```env
ORANGE_MONEY_CLIENT_ID="your-client-id"
ORANGE_MONEY_CLIENT_SECRET="your-client-secret"
ORANGE_MONEY_MERCHANT_KEY="your-merchant-key"
```

---

### Wave (Senegal, Ivory Coast)

```typescript
import { AfricanWalletFactory, WalletType } from '@/src/services/wallets/unified-wallet-factory';

const wave = AfricanWalletFactory.createWallet({
  type: WalletType.WAVE,
  country: 'SN',
});

const result = await wave.initiatePayment({
  phoneNumber: '221771234567',
  amount: 10000,
  currency: 'XOF',
  reference: `WAVE-${Date.now()}`,
  description: 'Payment',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/wave`,
});
```

**Environment Variables Required:**
```env
WAVE_API_KEY="your-api-key"
WAVE_SECRET_KEY="your-secret-key"
```

---

### Paystack (Nigeria, Ghana)

```typescript
import { AfricanWalletFactory, WalletType } from '@/src/services/wallets/unified-wallet-factory';

const paystack = AfricanWalletFactory.createWallet({
  type: WalletType.PAYSTACK,
  country: 'NG',
});

const result = await paystack.initiatePayment({
  phoneNumber: '2348012345678',
  email: 'customer@example.com',
  amount: 5000,
  currency: 'NGN',
  reference: `PAYSTACK-${Date.now()}`,
  description: 'Product purchase',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paystack`,
});

// Redirect to Paystack payment page
if (result.paymentUrl) {
  res.redirect(result.paymentUrl);
}
```

**Environment Variables Required:**
```env
PAYSTACK_SECRET_KEY="your-secret-key"
PAYSTACK_PUBLIC_KEY="your-public-key"
```

---

## Country Coverage Matrix

| Country | Code | Supported Providers |
|---------|------|---------------------|
| **Kenya** | KE | M-Pesa, Airtel Money, MTN |
| **Tanzania** | TZ | M-Pesa Tanzania, Tigo Pesa, Airtel, MTN |
| **Uganda** | UG | MTN, Airtel Money |
| **Nigeria** | NG | PawaPay, Paystack, Flutterwave, OPay, PalmPay |
| **Ghana** | GH | PawaPay, Paystack, Flutterwave, MTN, Moov Money |
| **Senegal** | SN | Orange Money, Wave |
| **Ivory Coast** | CI | Orange Money, Wave, MTN, Moov Money |
| **Mali** | ML | Orange Money, Wave |
| **Burkina Faso** | BF | Orange Money, Wave |
| **Benin** | BJ | Orange Money, Moov Money, MTN |
| **Togo** | TG | Moov Money, MTN |
| **Niger** | NE | Orange Money, Moov Money |
| **Zimbabwe** | ZW | EcoCash, Telecel Cash |
| **Zambia** | ZM | PawaPay, Airtel Money, Zamtel, MTN |
| **Mozambique** | MZ | PawaPay, M-Pesa, Halopesa |
| **Cameroon** | CM | MTN, Orange Money |
| **DRC** | CD | Orange Money, Airtel Money |
| **Gabon** | GA | Moov Money, MTN |
| **Central African Republic** | CF | Moov Money |
| **Chad** | TD | Moov Money |
| **South Africa** | ZA | Paystack, Flutterwave |
| **Rwanda** | RW | PawaPay, MTN, Airtel Money, Flutterwave |
| **Malawi** | MW | PawaPay, Airtel Money, Flutterwave |
| **Egypt** | EG | OPay |

---

## Webhook Integration

All providers support webhook callbacks for payment confirmations. Here's a unified webhook handler example:

```typescript
// app/api/webhooks/universal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AfricanWalletFactory, WalletType } from '@/src/services/wallets/unified-wallet-factory';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const provider = request.headers.get('x-provider') as WalletType;
  
  if (!provider) {
    return NextResponse.json({ error: 'Provider not specified' }, { status: 400 });
  }

  const wallet = AfricanWalletFactory.createWallet({
    type: provider,
    environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  });

  // Parse webhook payload based on provider
  const paymentData = parseWebhookPayload(provider, body);

  if (paymentData.status === 'SUCCESS') {
    // Update your database
    // Send confirmation email/SMS
    // Fulfill order
  }

  return NextResponse.json({ received: true });
}

function parseWebhookPayload(provider: WalletType, body: any) {
  // Implement provider-specific parsing logic
  switch (provider) {
    case WalletType.MPESA:
      return parseMpesaWebhook(body);
    case WalletType.FLUTTERWAVE:
      return parseFlutterwaveWebhook(body);
    // ... add other providers
    default:
      return body;
  }
}
```

---

## Error Handling

All adapters return consistent error formats:

```typescript
interface UnifiedPaymentResponse {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId?: string;
  providerReference?: string;
  message?: string;
  paymentUrl?: string;
}
```

Common error scenarios:

| Error | Cause | Solution |
|-------|-------|----------|
| `FAILED` with "Network error" | API unreachable | Implement retry logic |
| `FAILED` with "Invalid phone number" | Wrong format | Use `wallet.validatePhoneNumber()` |
| `PENDING` timeout | User didn't complete payment | Implement polling with `getTransactionStatus()` |
| `FAILED` with "Insufficient balance" | User has insufficient funds | Notify user to retry |

---

## Testing

All adapters support sandbox mode:

```typescript
const wallet = AfricanWalletFactory.createWallet({
  type: WalletType.MPESA,
  environment: 'sandbox', // Use sandbox credentials
});
```

### Test Phone Numbers by Provider

| Provider | Test Number | Test Amount |
|----------|-------------|-------------|
| M-Pesa Kenya | 254708375000 | Any amount |
| M-Pesa Tanzania | 255710000000 | Any amount |
| EcoCash | 263771234567 | Any amount |
| MTN Uganda | 256771234567 | Any amount |
| Orange Money SN | 221771234567 | Any amount |
| Wave SN | 221771234567 | Any amount |

---

## Best Practices

### 1. Phone Number Formatting

Always validate and format phone numbers:

```typescript
if (!wallet.validatePhoneNumber(phone)) {
  throw new Error('Invalid phone number');
}
```

### 2. Idempotency

Use unique references to prevent duplicate transactions:

```typescript
const reference = `${provider}-${Date.now()}-${crypto.randomUUID()}`;
```

### 3. Transaction Polling

For providers without webhooks, implement polling:

```typescript
async function pollTransactionStatus(
  wallet: UnifiedWalletAdapter,
  transactionId: string,
  maxAttempts = 10,
  intervalMs = 5000
) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await wallet.getTransactionStatus(transactionId);
    
    if (status.status === 'SUCCESS' || status.status === 'FAILED') {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Transaction status timeout');
}
```

### 4. Currency Handling

Always specify currency explicitly:

```typescript
await wallet.initiatePayment({
  amount: 1000,
  currency: 'KES', // Always specify
  // ...
});
```

### 5. Logging

Log all transactions for auditing:

```typescript
console.log('Payment initiated:', {
  provider: config.type,
  reference,
  amount,
  currency,
  phoneNumber,
  timestamp: new Date().toISOString(),
});
```

---

## Migration Guide

### From Legacy Adapters to Unified Factory

**Before:**
```typescript
import { MpesaAPI } from '@/src/lib/mpesa';

const mpesa = new MpesaAPI(config);
const result = await mpesa.initiateSTKPush(request);
```

**After:**
```typescript
import { AfricanWalletFactory, WalletType } from '@/src/services/wallets/unified-wallet-factory';

const wallet = AfricanWalletFactory.createWallet({
  type: WalletType.MPESA,
});
const result = await wallet.initiatePayment({
  phoneNumber: request.phoneNumber,
  amount: request.amount,
  currency: 'KES',
  reference: request.reference,
  description: request.description,
  callbackUrl: request.callbackUrl,
});
```

---

## Support & Documentation

| Provider | Official Documentation | Support Email |
|----------|----------------------|---------------|
| PawaPay | https://docs.pawapay.io/v2/docs/welcome | PawaPay support portal |
| M-Pesa | https://developer.safaricom.co.ke | apisupport@safaricom.co.ke |
| Flutterwave | https://developer.flutterwave.com | support@flutterwave.com |
| Paystack | https://paystack.com/docs | support@paystack.com |
| Orange Money | https://developer.orange.com | api-support@orange.com |
| Wave | https://business.wave.com | support@wave.com |
| MTN | https://momodeveloper.mtn.com | api-support@mtn.com |
| Airtel | https://openapi.airtel.africa | developer@airtel.com |

---

## Contributing

To add a new provider:

1. Create adapter in `src/lib/[provider].ts`
2. Add wallet type to `WalletType` enum
3. Update `UnifiedWalletAdapter` switch statements
4. Add environment variables to `.env.example`
5. Update this documentation

---

## License

All adapter code is proprietary and confidential. Do not distribute without authorization.
