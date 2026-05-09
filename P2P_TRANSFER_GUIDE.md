# P2P Cross-Border Transfer Guide

## Overview

The P2P Cross-Border Transfer feature enables users to send money directly from their WeduPay wallet to a recipient's mobile wallet in another African country. The system handles FX conversion, routing, compliance screening, wallet debiting, and automatic rollback on failure.

### Key Features

- **Cross-Border Transfers** — Send money across 30+ African countries
- **Real Balance Enforcement** — Transfers are blocked if the sender's wallet has insufficient funds; the UI shows live available balance before submission
- **Atomic Wallet Debit** — The sender's wallet is debited, the transfer record is created, and a transaction ledger entry is written in a single database transaction
- **Automatic Rollback** — If the payment provider call fails, the wallet balance is refunded atomically in the same operation
- **Automatic FX Conversion** — Best exchange rate via provider routing and Open Exchange Rates
- **Provider Fallback Routing** — When no configured payment provider covers a corridor, the engine falls back to a direct FX route so quoting always works
- **Direct to Mobile Wallet** — Funds land directly in recipient's M-Pesa, MTN, Airtel, EcoCash, etc.
- **Compliance Screening** — Built-in AML/risk scoring; high-risk transfers go to `PENDING_REVIEW` with funds held
- **Transparent Fees** — Exact fees shown before sending; quote valid for 10 minutes
- **Transfer History** — Full audit trail in wallet transaction history
- **Saved Recipients** — Store frequent recipients for faster transfers

---

## Transfer Flow

```
1. User enters amount + recipient → balance checked live in UI
2. GET /api/v1/wallets/balance?currency=KES  → show available balance
3. POST /api/v1/transfers/p2p/quote          → FX rate + fee preview
4. User confirms → POST /api/v1/transfers/p2p
   ├── Balance re-checked server-side
   ├── Compliance scored
   ├── DB transaction: wallet debit + P2PTransfer record + Transaction ledger entry
   ├── Payment dispatched to provider
   │   ├── SUCCESS → status = COMPLETED, transaction = COMPLETED
   │   └── FAILURE → wallet refunded atomically, status = FAILED, transaction = FAILED
   └── PENDING_REVIEW → funds held, status = PENDING_REVIEW
```

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

> **Fallback routing:** If no provider in the database covers the requested corridor, the engine falls back to a `WEDUPAY_INTERNAL` route using live Open Exchange Rates. This ensures quoting is always available even before provider configuration is complete.

---

## Quick Start

### 0. Check Available Balance

```http
GET /api/v1/wallets/balance?currency=KES
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wallet-uuid",
    "currency": "KES",
    "balance": 12000.00,
    "availableBalance": 10500.00,
    "pendingBalance": 1500.00
  }
}
```

`availableBalance` = `balance` minus any amounts in PROCESSING transfers.

---

### 1. Get a Transfer Quote

```http
POST /api/v1/transfers/p2p/quote
Content-Type: application/json

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
    "transactionMin": 1,
    "transactionMax": 5000,
    "dailyMax": 10000,
    "kycRequired": false
  },
  "validFor": 600
}
```

The quote is advisory — the live rate is re-fetched at execution time.

---

### 2. Execute the Transfer

```http
POST /api/v1/transfers/p2p
Content-Type: application/json

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

**Server-side steps (in order):**
1. Re-fetch live quote
2. Check `availableBalance >= totalDebit` — throws `INSUFFICIENT_FUNDS` if not
3. Run compliance scoring
4. Atomically: debit wallet + create `P2PTransfer` + create `Transaction` (type `P2P_TRANSFER`)
5. Dispatch to payment provider
6. On success: mark COMPLETED
7. On failure: refund wallet atomically + mark FAILED

**Success response (`COMPLETED`):**
```json
{
  "success": true,
  "requestId": "REQ-1234567890-abc",
  "transfer": {
    "id": "transfer-uuid",
    "reference": "P2P-1714567890-abc",
    "status": "COMPLETED",
    "message": null
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

**Compliance hold response (`PENDING_REVIEW`):**
```json
{
  "success": true,
  "transfer": {
    "status": "PENDING_REVIEW",
    "message": "Transfer submitted and is under compliance review. Funds are held pending approval."
  }
}
```
Funds are debited and held. They are released when the compliance team approves or rejects.

**Insufficient funds response (HTTP 500, thrown before any DB writes):**
```json
{
  "success": false,
  "error": "Insufficient funds. Available: 4500.00 KES, required: 5125.00 KES"
}
```

**Payment failure response (wallet auto-refunded):**
```json
{
  "success": false,
  "transfer": {
    "status": "FAILED",
    "message": "Payment failed: Provider timeout. Your funds have been refunded."
  }
}
```

---

### 3. Check Transfer Status

```http
GET /api/v1/transfers/p2p?ref=P2P-1714567890-abc
```

---

### 4. View Transfer History

```http
GET /api/v1/transfers/p2p/history?page=1&limit=20&status=COMPLETED
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `status` | string | — | Optional filter: `COMPLETED`, `FAILED`, `PENDING_REVIEW`, `PROCESSING` |

**Response:**
```json
{
  "success": true,
  "transfers": [
    {
      "transferRef": "P2P-1714567890-abc",
      "status": "COMPLETED",
      "sendAmount": 5000,
      "sendCurrency": "KES",
      "receiveAmount": 91875,
      "receiveCurrency": "TZS",
      "recipientPhone": "255712345678",
      "recipientName": "John Doe",
      "recipientCountry": "TZ",
      "createdAt": "2026-05-09T10:30:00Z",
      "completedAt": "2026-05-09T10:30:15Z"
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

## API Reference

### POST /api/v1/transfers/p2p/quote

Get a pre-transfer quote. Does **not** debit the wallet or create any records.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sendAmount` | number | Yes | Amount to send (must be positive) |
| `sendCurrency` | string | Yes | 3-letter currency code |
| `recipientPhone` | string | Yes | Min 10 digits, with country code |
| `recipientCountry` | string | Yes | ISO 3166-1 alpha-2 country code |
| `recipientName` | string | No | Recipient full name |
| `recipientWalletType` | string | No | Default: `mobile_wallet` |
| `description` | string | No | Transfer memo |

---

### POST /api/v1/transfers/p2p

Execute the transfer. Debits wallet atomically.

**Request body:** same fields as quote, plus:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `saveRecipient` | boolean | No | Save recipient for future transfers |

**Transfer status values:**

| Status | Wallet State | Description |
|--------|-------------|-------------|
| `PROCESSING` | Debited | Payment dispatched to provider |
| `COMPLETED` | Debited (final) | Funds delivered to recipient |
| `FAILED` | Refunded | Payment failed; wallet restored |
| `PENDING_REVIEW` | Debited + held | Compliance review in progress |

---

### GET /api/v1/transfers/p2p/history

**Query params:** `page`, `limit`, `status` — all optional, all default safely.

---

### GET /api/v1/transfers/p2p/recipients
### POST /api/v1/transfers/p2p/recipients
### DELETE /api/v1/transfers/p2p/recipients?id=RECIPIENT-ID

Saved recipients are also auto-saved when `saveRecipient: true` on a successful transfer.

---

## Fee Structure

### Transfer Fees (applied to `sendAmount`)

| Amount Range | Fee Percentage | Min Fee | Max Fee |
|--------------|----------------|---------|---------|
| ≤ 1,000 | 2.0% | 1 unit | — |
| 1,001 – 5,000 | 1.5% | — | — |
| 5,001 – 10,000 | 1.0% | — | — |
| > 10,000 | 0.5% | — | 500 units |

### FX Fees

Built into the exchange rate as a spread applied in `CrossBorderRoutingEngine`:
- **Direct route:** 2% spread + 1% margin on target amount
- **Via USD:** compound spread across both legs

`totalDebit = sendAmount + transferFee + fxFee`

---

## Compliance & Risk

Every transfer runs through `runComplianceChecks()` before any money moves:

| Check | Logic |
|-------|-------|
| Sanctions | Placeholder — always passes (production: integrate OFAC/UN API) |
| Fraud | Placeholder — always passes (production: ML scoring) |
| Amount threshold | Fails if `amount >= 10,000` in send currency |
| Country risk | High-risk country codes increase risk score |

**Risk scoring:**

| Risk Score | Level | Action |
|------------|-------|--------|
| 0–29 | LOW | Auto-approved, payment dispatched immediately |
| 30–59 | MEDIUM | Auto-approved, monitoring flag set |
| 60–100 | HIGH | `PENDING_REVIEW` — funds held, manual review required |

If compliance `passed === false`, the transfer throws before any wallet debit occurs.

---

## Error Handling

| Scenario | When it happens | Wallet impact |
|----------|----------------|---------------|
| `INSUFFICIENT_FUNDS` | `availableBalance < totalDebit` | Not touched |
| `Compliance check failed` | Sanctions/fraud check failed | Not touched |
| Payment provider error | Provider API exception | Auto-refunded |
| Payment provider failure | Provider returns `success: false` | Auto-refunded |
| `PENDING_REVIEW` | Risk score ≥ 60 | Debited + held |

---

## Wallet & Ledger Impact

Each successful transfer execution creates:

1. **Wallet debit** — `wallet.balance` decremented by `totalDebit`
2. **P2PTransfer record** — full transfer details in `p2p_transfers` table
3. **Transaction record** — `type: P2P_TRANSFER`, `status: PROCESSING/COMPLETED/FAILED` in `transactions` table

On failure/rollback:
- Wallet balance incremented back by `totalDebit`
- Transaction record updated to `FAILED`
- P2PTransfer record updated to `FAILED` with `failureReason`

---

## Webhook Events

| Event | Description |
|-------|-------------|
| `transfer.initiated` | Transfer created and wallet debited |
| `transfer.processing` | Payment dispatched to provider |
| `transfer.completed` | Funds delivered to recipient |
| `transfer.failed` | Transfer failed; wallet refunded |
| `transfer.review_required` | Compliance review required; funds held |

---

## Troubleshooting

### "Insufficient funds" shown immediately on form

The form fetches `GET /api/v1/wallets/balance?currency=KES` on load and when the currency changes. If the amount field border turns red, the user's available balance is below the entered amount. The "Get Quote" button is disabled until the amount is corrected.

### Transfer stuck in PENDING_REVIEW

Funds are held pending manual compliance review. Typical resolution: 1–2 business hours. Contact support if unresolved after 24 hours.

### Transfer FAILED, funds not refunded

The rollback is atomic — it runs in the same Prisma transaction as the status update. If the UI shows FAILED, the wallet balance has already been restored. Refresh the wallet balance page to confirm.

### Quote returns "No available routes"

This should no longer occur — the engine now falls back to a `WEDUPAY_INTERNAL` direct or via-USD route when no payment providers are configured for a corridor in the database.

---

## Support

- **Email:** support@wedupay.com
- **Documentation:** https://docs.wedupay.com/p2p-transfers
- **Status Page:** https://status.wedupay.com

---

*Proprietary — WeduPay*
