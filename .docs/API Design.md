# WeduPay – Unified API Specification (Role-Based)

This document serves as the primary technical reference for the WeduPay platform. All endpoints are categorized by the target user role to streamline integration and access control.

## Environments
- **Production**: `https://wedupay.com/api/v1`
- **Staging**: `https://stg.wedupay.com/api/v1`

---

# 1. Global Authentication
Common authentication patterns required for all roles.

## Authentication Methods
### Session-based (Web)
Uses Supabase session cookies:
- `sb-access-token`
- `sb-refresh-token`

### API Key (B2B/Merchant)
Header: `X-API-Key: wpy_xxxxxx`

## Core Auth Endpoints
- `POST /auth/session` - Create/Refresh session
- `POST /auth/create-user` - Initialize platform profile
- `GET /auth/user` - Get current session profile details
- `POST /auth/sync-profile` - Sync with Identity Provider

---

# 2. Consumer API (Users)
For individual customers managing personal finances, mobile wallets, and P2P transfers.

## Wallet & Funds Management
- `GET /wallets/balance` - Get balances across all mobile wallets
- `POST /wallets/fund` - Deposit funds into personal wallet (simple, no MNO routing)
- `POST /wallets/withdraw` - Withdraw funds to linked mobile account
- `GET /wallets/history` - Comprehensive transaction audit logs

## Mobile Money Deposits (PawaPay)
Deposits routed through PawaPay's aggregator across 18 African countries. The flow is asynchronous: the API returns `202` immediately and the wallet is credited when PawaPay fires the webhook.

- `POST /deposits/predict` - Detect MNO (mobile network operator) for a phone number before depositing
- `POST /deposits` - Initiate a mobile money deposit; returns `depositId` and `PENDING` status
- `GET /deposits/{depositId}` - Poll deposit status (fallback when webhook is delayed)

### Deposit flow
```
1. POST /deposits/predict        → confirm detected MNO (e.g. MPESA_KE)
2. POST /deposits                → PawaPay initiates push to customer's phone
3. Customer approves on phone    → PawaPay fires POST /webhooks/pawapay
4. Webhook processor credits wallet and updates Transaction to COMPLETED
5. GET /deposits/{id}            → optional polling for status confirmation
```

### Supported countries
BJ, BF, CM, CD, CG, CI, GA, GH, KE, MW, MZ, NG, RW, SN, SL, TZ, UG, ZM

### Request — POST /deposits
```json
{
  "phoneNumber": "254712345678",
  "amount": 500,
  "currency": "KES",
  "description": "WeduPay deposit",
  "provider": "MPESA_KE",
  "country": "KE",
  "walletId": "wallet-uuid"
}
```
`provider` and `country` are optional — PawaPay auto-detects the MNO when omitted.

### Response — 202 Accepted
```json
{
  "success": true,
  "requestId": "DEP-1746789012-abc",
  "depositId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "provider": "MPESA_KE",
  "message": "Deposit initiated. Funds will be credited to your wallet upon confirmation."
}
```

### Status values
| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting customer approval on phone |
| `SUCCESS` | Payment confirmed; wallet credited |
| `FAILED` | Payment rejected or timed out |
| `CANCELLED` | Customer cancelled on device |

## P2P Payments & Transfers
- `GET /wallets/balance?currency=KES` - Check available balance for a currency before sending
- `POST /transfers/p2p/quote` - Calculate FX rate, fees, and total debit for a transfer (no money moved)
- `POST /transfers/p2p` - Execute transfer: checks balance, debits wallet atomically, dispatches to provider, refunds on failure
- `GET /transfers/p2p/history` - Paginated transfer history (`?page=1&limit=20&status=COMPLETED`)
- `GET /transfers/p2p/recipients` - List saved recipients
- `POST /transfers/p2p/recipients` - Save a new recipient
- `DELETE /transfers/p2p/recipients?id=RECIPIENT-ID` - Remove a saved recipient

> **Balance & atomicity:** `POST /transfers/p2p` enforces available balance server-side and writes the wallet debit, P2PTransfer record, and Transaction ledger entry in a single database transaction. If the payment provider call fails, the wallet is refunded in the same atomic rollback.

## Virtual Cards
- `POST /cards` - Issue a new USD Virtual Card
- `GET /cards/{id}` - Get card details and secure PAN
- `POST /cards/{id}/fund` - Move money from wallet to virtual card

## Identity (KYC)
- `POST /kyc/submit` - Upload identity documents (ID/Passport)
- `GET /kyc/status` - Track verification progress

---

# 3. Business API (Merchants)
For merchants, developers, and businesses collecting payments and managing revenue.

## Payment Collection
- `POST /payments` - Initiate payment request (M-Pesa, MTN, EcoCash, PawaPay-supported regional rails)
- `POST /routing/payment` - Initiate routed mobile-money payment through the best available rail
- `GET /payments/{id}` - Retrieve payment status and metadata
- `GET /merchant/payment-links` - Manage reusable "No-Code" payment links

Payment rail policy:

- Zimbabwe transactions use the direct official EcoCash API.
- Supported non-Zimbabwe regional transactions may route through PawaPay.
- Paynow is intentionally excluded from the active architecture.

## Financial Analytics
- `GET /analytics/revenue` - Real-time revenue aggregation
- `GET /analytics/payment-methods` - Insights into customer preferences
- `GET /analytics/success-rate` - Track transaction conversion health
- `GET /analytics/geography` - User distribution and volume by region

## Settlements & Withdrawals
- `GET /settlements/balance` - Check funds available for business settlement
- `POST /settlements/request` - Initiate payout to connected bank/mobile account
- `GET /settlements/history` - Audit trail of all payouts

## Developer Tools
- `GET /v1/api-keys` - Manage production API keys
- `POST /webhooks/endpoints` - Configure HTTP callbacks for real-time events
- `GET /exports` - Request CSV/Excel data exports for accounting

---

# 4. Platform API (Admins)
Restricted endpoints for platform operators and compliance officers.

## User & Compliance Management
- `GET /admin/users` - Global search of all platform users
- `GET /admin/compliance/{ref}` - Perform AML/KYC deep-audit on flagged transactions
- `PUT /users/{id}` - Manually update user status or limits

## Routing & Infrastructure
- `POST /routing/payment` - Configure automated routing engine rules
- `GET /routing/health` - Monitor real-time status of payment carriers
- `GET /admin/stats` - Global platform volume and systemic health overview

---

# 5. System & Foreign Exchange
Publicly accessible infrastructure data.

## Market Data
- `GET /fx/rates` - Get current exchange rates (USD/KES/ZWL/etc)
- `GET /fx/convert` - Perform currency conversion calculations

## Health
- `GET /health` - Global application health status

---

# Webhook Payloads (Common)
When processing events from providers, payloads follow this structure:

```json
{
  "event": "payment.succeeded",
  "data": {
    "id": "txn_8872",
    "amount": 50.00,
    "currency": "USD",
    "status": "completed",
    "metadata": { "order_id": "123" }
  }
}
```
