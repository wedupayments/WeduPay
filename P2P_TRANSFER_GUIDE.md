# P2P Cross-Border Transfer Guide

## Overview

The P2P Cross-Border Transfer feature enables users to send money directly from their mobile wallet in one African country to a recipient's mobile wallet in another country. The system handles FX conversion, routing, compliance, and delivery automatically.

### Key Features

- 🌍 **Cross-Border Transfers** - Send money across 30+ African countries
- 💱 **Automatic FX Conversion** - Best exchange rates via routing optimization
- 📱 **Direct to Mobile Wallet** - Funds land directly in recipient's M-Pesa, MTN, Airtel, etc.
- ✅ **Compliance Checks** - Built-in AML/sanctions screening
- 💰 **Transparent Fees** - See exact fees before sending
- 📊 **Transfer Tracking** - Real-time status updates
- 👥 **Saved Recipients** - Store frequent recipients for faster transfers

---

## Supported Corridors

### East Africa
| From | To | Providers | Delivery |
|------|-----|-----------|----------|
| Kenya | Tanzania | M-Pesa, Airtel, Tigo | Instant |
| Kenya | Uganda | M-Pesa, Airtel, MTN | Instant |
| Tanzania | Kenya | M-Pesa, Airtel | Instant |
| Uganda | Kenya | M-Pesa, Airtel, MTN | Instant |

### West Africa
| From | To | Providers | Delivery |
|------|-----|-----------|----------|
| Nigeria | Ghana | Paystack, Flutterwave | Instant |
| Nigeria | Senegal | Flutterwave, Orange Money | < 1 hour |
| Ghana | Nigeria | Paystack, Flutterwave | Instant |
| Ghana | Ivory Coast | Flutterwave, Orange Money | < 1 hour |

### Southern Africa
| From | To | Providers | Delivery |
|------|-----|-----------|----------|
| Zimbabwe | Zambia | EcoCash, Airtel | Instant |
| Zambia | Zimbabwe | Airtel, Zamtel | Instant |
| Mozambique | South Africa | Halopesa, M-Pesa | < 1 hour |

### Pan-African (via aggregators)
| From | To | Providers | Delivery |
|------|-----|-----------|----------|
| Any supported | Any supported | Flutterwave | < 24 hours |
| Any supported | Any supported | Africa's Talking | < 24 hours |

---

## Quick Start

### 1. Get a Transfer Quote

```typescript
POST /api/v1/transfers/p2p/quote

{
  "sendAmount": 5000,
  "sendCurrency": "KES",
  "recipientPhone": "255712345678",
  "recipientCountry": "TZ",
  "recipientName": "John Doe",
  "description": "Family support"
}
```

**Response:**
```json
{
  "success": true,
  "quote": {
    "sendAmount": 5000,
    "sendCurrency": "KES",
    "receiveAmount": 91875,
    "receiveCurrency": "TZS",
    "exchangeRate": 19.45,
    "fees": {
      "transferFee": 75,
      "fxFee": 50,
      "totalFees": 125
    },
    "totalDebit": 5125,
    "estimatedDelivery": "Instant",
    "route": {
      "provider": "flutterwave",
      "fxRoute": "direct"
    }
  },
  "limits": {
    "transactionMin": 1000,
    "transactionMax": 1500000,
    "dailyMax": 5000000,
    "kycRequired": false
  }
}
```

### 2. Execute the Transfer

```typescript
POST /api/v1/transfers/p2p

{
  "sendAmount": 5000,
  "sendCurrency": "KES",
  "recipientPhone": "255712345678",
  "recipientCountry": "TZ",
  "recipientName": "John Doe",
  "description": "Family support",
  "saveRecipient": true
}
```

**Response:**
```json
{
  "success": true,
  "transfer": {
    "id": "p2p-transfer-id",
    "reference": "P2P-1234567890-abc",
    "status": "COMPLETED",
    "message": "Transfer successful"
  },
  "recipient": {
    "phone": "255712345678",
    "country": "TZ"
  },
  "amount": {
    "send": 5000,
    "receive": 91875,
    "currency": "TZS"
  },
  "delivery": {
    "estimated": "Instant",
    "providerReference": "TXN-ABC123"
  },
  "nextSteps": [
    "Transfer completed successfully",
    "Recipient has received the funds",
    "A confirmation email has been sent"
  ]
}
```

### 3. Check Transfer Status

```typescript
GET /api/v1/transfers/p2p?ref=P2P-1234567890-abc
```

**Response:**
```json
{
  "success": true,
  "transfer": {
    "transferRef": "P2P-1234567890-abc",
    "status": "COMPLETED",
    "sendAmount": 5000,
    "sendCurrency": "KES",
    "receiveAmount": 91875,
    "receiveCurrency": "TZS",
    "exchangeRate": 19.45,
    "recipientPhone": "255712345678",
    "recipientCountry": "TZ",
    "recipientName": "John Doe",
    "providerReference": "TXN-ABC123",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:30:15Z"
  },
  "statusHistory": [
    {
      "status": "INITIATED",
      "timestamp": "2024-01-15T10:30:00Z",
      "description": "Transfer initiated"
    },
    {
      "status": "COMPLETED",
      "timestamp": "2024-01-15T10:30:15Z",
      "description": "Funds delivered to recipient"
    }
  ]
}
```

---

## API Reference

### POST /api/v1/transfers/p2p/quote

Get a quote for a cross-border P2P transfer.

**Request Body:**
```json
{
  "sendAmount": 5000,
  "sendCurrency": "KES",
  "recipientPhone": "255712345678",
  "recipientCountry": "TZ",
  "recipientName": "John Doe",
  "recipientWalletType": "mobile_wallet",
  "description": "Family support"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `sendAmount` | number | Amount to send |
| `sendCurrency` | string | Sender's currency |
| `receiveAmount` | number | Amount recipient gets |
| `receiveCurrency` | string | Recipient's currency |
| `exchangeRate` | number | FX rate applied |
| `fees.transferFee` | number | Transfer fee |
| `fees.fxFee` | number | FX conversion fee |
| `fees.totalFees` | number | Total fees |
| `totalDebit` | number | Total amount to debit |
| `estimatedDelivery` | string | Delivery time estimate |
| `route.provider` | string | Selected provider |
| `route.fxRoute` | string | FX route type |

---

### POST /api/v1/transfers/p2p

Execute a cross-border P2P transfer.

**Request Body:**
```json
{
  "sendAmount": 5000,
  "sendCurrency": "KES",
  "recipientPhone": "255712345678",
  "recipientCountry": "TZ",
  "recipientName": "John Doe",
  "recipientWalletType": "mobile_wallet",
  "description": "Family support",
  "saveRecipient": true
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `COMPLETED` | Transfer successful, funds delivered |
| `PROCESSING` | Transfer in progress |
| `PENDING_REVIEW` | Awaiting compliance review |
| `FAILED` | Transfer failed |
| `REFUNDED` | Transfer refunded to sender |

---

### GET /api/v1/transfers/p2p/:ref

Get status of a specific transfer.

**Response:**
```json
{
  "success": true,
  "transfer": {
    "transferRef": "P2P-1234567890-abc",
    "status": "COMPLETED",
    "sendAmount": 5000,
    "sendCurrency": "KES",
    "receiveAmount": 91875,
    "receiveCurrency": "TZS",
    "recipientPhone": "255712345678",
    "recipientCountry": "TZ",
    "recipientName": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:30:15Z"
  }
}
```

---

### GET /api/v1/transfers/p2p/history

Get user's transfer history.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | - | Filter by status |

**Response:**
```json
{
  "success": true,
  "transfers": [
    {
      "transferRef": "P2P-1234567890-abc",
      "status": "COMPLETED",
      "sendAmount": 5000,
      "sendCurrency": "KES",
      "receiveAmount": 91875,
      "receiveCurrency": "TZS",
      "recipientPhone": "255712345678",
      "recipientName": "John Doe",
      "recipientCountry": "TZ",
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:30:15Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET /api/v1/transfers/p2p/recipients

Get user's saved recipients.

**Response:**
```json
{
  "success": true,
  "recipients": [
    {
      "id": "recipient-id",
      "name": "John Doe",
      "phoneNumber": "255712345678",
      "country": "TZ",
      "walletType": "mobile_wallet",
      "isVerified": true,
      "lastUsedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/v1/transfers/p2p/recipients

Save a recipient for future transfers.

**Request Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "255712345678",
  "country": "TZ",
  "walletType": "mobile_wallet"
}
```

---

### DELETE /api/v1/transfers/p2p/recipients?id=RECIPIENT-ID

Delete a saved recipient.

---

## Transfer Limits

### Default Limits by Country

| Country | Currency | Min Transaction | Max Transaction | Daily Max | Monthly Max |
|---------|----------|-----------------|-----------------|-----------|-------------|
| Kenya | KES | 10 | 50,000 | 150,000 | 300,000 |
| Tanzania | TZS | 1,000 | 1,500,000 | 5,000,000 | 15,000,000 |
| Uganda | UGX | 1,000 | 1,500,000 | 5,000,000 | 15,000,000 |
| Nigeria | NGN | 100 | 500,000 | 1,000,000 | 5,000,000 |
| Ghana | GHS | 1 | 5,000 | 10,000 | 50,000 |
| Zimbabwe | USD | 1 | 5,000 | 10,000 | 50,000 |
| Zambia | ZMW | 10 | 50,000 | 100,000 | 500,000 |

### KYC Requirements

| Amount (USD equivalent) | KYC Required |
|-------------------------|--------------|
| < $100 | None |
| $100 - $1,000 | Basic KYC (phone verification) |
| $1,000 - $5,000 | Enhanced KYC (ID verification) |
| > $5,000 | Premium KYC (proof of address) |

---

## Fee Structure

### Transfer Fees

| Amount Range | Fee Percentage | Min Fee | Max Fee |
|--------------|----------------|---------|---------|
| < $100 | 2% | $1 | $2 |
| $100 - $1,000 | 1.5% | $2 | $15 |
| $1,000 - $5,000 | 1% | $15 | $50 |
| > $5,000 | 0.5% | $50 | $500 |

### FX Fees

FX fees are built into the exchange rate as a spread:
- **Major currencies (USD, EUR, GBP):** 1-2% spread
- **African currencies:** 2-3% spread
- **Cross-border within same currency zone (XOF, XAF):** 0.5-1% spread

### Example Calculation

Sending 5,000 KES to Tanzania:

```
Send Amount:     5,000 KES
Transfer Fee:       75 KES (1.5%)
FX Fee:             50 KES (embedded in rate)
Total Debit:     5,125 KES

Exchange Rate:  1 KES = 19.45 TZS
Receive Amount: 91,875 TZS
```

---

## Compliance & Security

### Automated Checks

Every transfer goes through:

1. **Sanctions Screening** - Check against OFAC, UN, EU sanctions lists
2. **Fraud Detection** - Pattern analysis for suspicious activity
3. **Amount Threshold** - Flag high-value transfers
4. **Country Risk** - Enhanced screening for high-risk countries

### Compliance Status Flow

```
INITIATED → COMPLIANCE_CHECK → [REVIEW if needed] → PROCESSING → COMPLETED
                                    ↓
                               [REJECT if failed]
```

### Risk Levels

| Risk Level | Score | Action |
|------------|-------|--------|
| LOW | 0-29 | Auto-approve |
| MEDIUM | 30-59 | Auto-approve with monitoring |
| HIGH | 60-100 | Manual review required |

---

## Error Handling

### Common Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `LIMIT_EXCEEDED` | Amount exceeds transfer limits | Reduce amount or complete KYC upgrade |
| `COMPLIANCE_FAILED` | Failed compliance check | Contact support with documentation |
| `INVALID_RECIPIENT` | Invalid phone number or country | Verify recipient details |
| `INSUFFICIENT_FUNDS` | Sender has insufficient balance | Add funds to wallet |
| `PROVIDER_UNAVAILABLE` | Payment provider temporarily down | Try again later or use alternative provider |
| `EXPIRED_QUOTE` | Quote has expired (>10 min old) | Get a new quote |

### Error Response Format

```json
{
  "success": false,
  "requestId": "REQ-123456",
  "error": "LIMIT_EXCEEDED",
  "message": "Amount exceeds daily transfer limit",
  "details": {
    "currentDailyTotal": 80000,
    "dailyLimit": 100000,
    "requestedAmount": 50000
  }
}
```

---

## Best Practices

### 1. Always Get a Quote First

```typescript
// Get quote before showing to user
const quote = await fetch('/api/v1/transfers/p2p/quote', {
  method: 'POST',
  body: JSON.stringify(transferData),
});

// Display quote to user for confirmation
// Then execute on user confirmation
```

### 2. Save Frequent Recipients

```typescript
// Save recipient after successful transfer
await fetch('/api/v1/transfers/p2p/recipients', {
  method: 'POST',
  body: JSON.stringify({
    name: recipientName,
    phoneNumber: recipientPhone,
    country: recipientCountry,
  }),
});
```

### 3. Implement Status Polling

```typescript
// Poll transfer status every 5 seconds until completed
async function pollTransferStatus(ref: string) {
  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`/api/v1/transfers/p2p?ref=${ref}`);
    const data = await response.json();

    if (data.transfer.status === 'COMPLETED' || data.transfer.status === 'FAILED') {
      return data.transfer;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Transfer status timeout');
}
```

### 4. Handle Compliance Reviews

```typescript
if (result.status === 'PENDING_REVIEW') {
  // Notify user about review
  showNotification(
    'Transfer under review',
    'Your transfer is being reviewed. This usually takes 1-2 hours.',
    'info'
  );

  // Set up status polling
  pollTransferStatus(result.transfer.reference);
}
```

---

## Webhook Integration

### Transfer Status Webhook

Configure webhook URL to receive real-time updates:

```typescript
POST /api/webhooks/p2p-transfer

{
  "event": "transfer.completed",
  "transferRef": "P2P-1234567890-abc",
  "status": "COMPLETED",
  "sendAmount": 5000,
  "sendCurrency": "KES",
  "receiveAmount": 91875,
  "receiveCurrency": "TZS",
  "recipientPhone": "255712345678",
  "recipientCountry": "TZ",
  "completedAt": "2024-01-15T10:30:15Z"
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `transfer.initiated` | Transfer created |
| `transfer.processing` | Payment initiated to provider |
| `transfer.completed` | Funds delivered to recipient |
| `transfer.failed` | Transfer failed |
| `transfer.refunded` | Transfer refunded to sender |
| `transfer.review_required` | Compliance review needed |

---

## Testing

### Test Phone Numbers

| Country | Test Number | Result |
|---------|-------------|--------|
| Kenya | 254700000000 | Success |
| Tanzania | 255710000000 | Success |
| Nigeria | 2348000000000 | Success |
| Ghana | 233200000000 | Success |
| Any | 000000000000 | Failure (for testing error handling) |

### Test Scenarios

```typescript
// Test successful transfer
await testTransfer({
  sendAmount: 1000,
  recipientPhone: '254700000000',
  recipientCountry: 'KE',
  expectedStatus: 'COMPLETED',
});

// Test compliance review trigger
await testTransfer({
  sendAmount: 10000, // High amount
  recipientPhone: '254700000000',
  recipientCountry: 'KE',
  expectedStatus: 'PENDING_REVIEW',
});

// Test failure handling
await testTransfer({
  sendAmount: 1000,
  recipientPhone: '000000000000', // Invalid
  recipientCountry: 'KE',
  expectedStatus: 'FAILED',
});
```

---

## Troubleshooting

### Issue: Transfer Stuck in Processing

**Cause:** Provider API timeout or network issue

**Solution:**
```typescript
// Check provider status
const health = await fetch('/api/v1/routing/health');

// If provider unhealthy, system should auto-reroute
// Contact support if still stuck after 24 hours
```

### Issue: Compliance Review Taking Too Long

**Cause:** Manual review backlog or missing documentation

**Solution:**
1. Check email for documentation requests
2. Submit required documents via support portal
3. Typical review time: 1-2 business hours

### Issue: Recipient Not Receiving Funds

**Cause:** Wrong phone number or wallet type mismatch

**Solution:**
```typescript
// Verify transfer details
const status = await fetch(`/api/v1/transfers/p2p?ref=${transferRef}`);

// If phone number wrong, contact support immediately for recall
// If wallet type mismatch, system should auto-correct
```

---

## Support

For issues or questions:

- **Email:** support@wedupay.com
- **Documentation:** https://docs.wedupay.com/p2p-transfers
- **Status Page:** https://status.wedupay.com

---

## License

Proprietary - WeduPay
