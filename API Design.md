# Fintech Platform – Complete API Reference

## Overview

This document defines all REST API endpoints for the fintech platform.

Base API paths:
- `/api` - Legacy/direct endpoints
- `/api/v1` - Versioned API (recommended)

All APIs return JSON responses.

---

# Authentication

Most endpoints require authentication via Supabase session cookies or API keys.

## Session-based Authentication

Cookies:
- `sb-access-token` - Supabase access token
- `sb-refresh-token` - Supabase refresh token

## API Key Authentication

Header:
```
X-API-Key: wpy_your_api_key_here
```

---

# Authentication Endpoints

## Create User Profile

`POST /api/auth/create-user`

Creates user profile after Supabase registration.

Request:
```json
{
  "supabaseUserId": "abc123-def456",
  "email": "user@example.com",
  "phoneNumber": "254712345678",
  "country": "KE",
  "role": "USER"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phoneNumber": "254712345678",
    "country": "KE",
    "kycStatus": "pending",
    "role": "USER"
  }
}
```

## Manage Session

`POST /api/auth/session` - Create session
`GET /api/auth/session` - Get current session
`DELETE /api/auth/session` - Logout

POST Request:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresAt": 1234567890
}
```

## Other Auth Endpoints

- `POST /api/auth/sync-profile` - Sync user profile
- `GET /api/auth/user` - Get current user
- `GET /api/auth/health` - Auth service health check

---

# Payments API

## Create Payment

`POST /api/payments`

Initiates a mobile wallet payment.

Request:
```json
{
  "wallet": "mpesa",
  "phone": "254712345678",
  "amount": 50,
  "currency": "KES"
}
```

Response:
```json
{
  "status": "pending",
  "transactionId": "txn_123456"
}
```

## Provider-Specific Payments

- `POST /api/mpesa` - M-Pesa payment
- `POST /api/ecocash` - EcoCash payment
- `POST /api/mtn` - MTN Mobile Money payment

## Payment Status

- `GET /api/mpesa/status/[checkoutRequestId]` - M-Pesa status
- `GET /api/ecocash/status/[reference]` - EcoCash status
- `GET /api/mtn/status/[referenceId]` - MTN status

## Payment References

`GET /api/payment-references` - List payment references

---

# Transfers API

## Create Transfer

`POST /api/transfers`

Transfers funds between wallets.

Request:
```json
{
  "sourceWallet": "mpesa",
  "destinationWallet": "ecocash",
  "amount": 100,
  "currency": "USD",
  "recipient": "263771234567"
}
```

Response:
```json
{
  "status": "processing",
  "transferId": "tr_987654"
}
```

---

# Wallets API

## Get Wallet Balance

`GET /api/wallets/balance`

Response:
```json
{
  "wallet": "mpesa",
  "balance": 240.50,
  "currency": "KES"
}
```

## Wallet Management

- `GET /api/wallets` - List all wallets
- `POST /api/wallets` - Create wallet
- `GET /api/wallets/[id]` - Get wallet details

---

# Transactions API

## List Transactions

`GET /api/transactions`

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

Response:
```json
{
  "transactions": [
    {
      "id": "txn_1",
      "amount": 50,
      "currency": "KES",
      "status": "completed",
      "createdAt": "2026-04-06T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

---

# Cards API

## Create Virtual Card

`POST /api/cards`

Request:
```json
{
  "currency": "USD"
}
```

Response:
```json
{
  "cardId": "card_123",
  "status": "active"
}
```

## Card Management

- `GET /api/cards` - List cards
- `GET /api/cards/[id]` - Get card details
- `POST /api/cards/[id]/fund` - Fund card

---

# FX (Foreign Exchange) API

## Convert Currency

`GET /api/fx/convert`

Query Parameters:
- `from` - Source currency (e.g., USD)
- `to` - Target currency (e.g., ZWL)
- `amount` - Amount to convert

Response:
```json
{
  "success": true,
  "conversion": {
    "from": "USD",
    "to": "ZWL",
    "amount": 100,
    "convertedAmount": 32150.00,
    "rate": 321.50,
    "fee": 50.00,
    "totalAmount": 32200.00,
    "source": "market",
    "updatedAt": "2026-04-06T10:00:00Z"
  }
}
```

## Get Exchange Rates

`GET /api/fx/rates`

Query Parameters (optional):
- `from` - Base currency
- `to` - Target currency

Response:
```json
{
  "success": true,
  "rates": [
    {
      "from": "USD",
      "to": "KES",
      "rate": 129.50,
      "inverseRate": 0.0077,
      "source": "market",
      "updatedAt": "2026-04-06T10:00:00Z"
    }
  ],
  "count": 15
}
```

---

# Tenant Management API

## Switch Tenant

`POST /api/tenant/switch`

Request:
```json
{
  "tenantSlug": "my-company"
}
```

Response:
```json
{
  "success": true,
  "tenant": {
    "id": "tenant-123",
    "slug": "my-company",
    "name": "My Company"
  }
}
```

## Tenant Memberships

`GET /api/tenant/memberships` - List user's tenant memberships

---

# Waitlist API

## Join Waitlist

`POST /api/waitlist`

Request:
```json
{
  "email": "user@example.com",
  "type": "CUSTOMER",
  "name": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "entry": {
    "id": "waitlist-123",
    "email": "user@example.com",
    "type": "CUSTOMER"
  },
  "position": 42,
  "message": "You've been added to the waitlist!"
}
```

## List Waitlist

`GET /api/waitlist/list` - Admin endpoint to view waitlist

---

# Merchant API

Merchants use the same API endpoints as customers but with a `MERCHANT` role. The platform automatically provides merchant-specific features based on the user's role.

## Merchant Registration

When creating a user with the `MERCHANT` role:

`POST /api/auth/create-user`

Request:
```json
{
  "supabaseUserId": "abc123-def456",
  "email": "merchant@example.com",
  "phoneNumber": "254712345678",
  "country": "KE",
  "role": "MERCHANT"
}
```

## Merchant Permissions

Merchants automatically receive these permissions:
- `read` - Read access to resources
- `write` - Write access to resources
- `payments:manage` - Manage payment operations
- `transfers:manage` - Manage transfer operations

## Merchant Dashboard

`GET /api/dashboard/customer`

Returns merchant-specific dashboard data including:
- Total payments received
- Completed payment count
- Pending settlements
- Active wallets
- Recent merchant payments

Response:
```json
{
  "user": {
    "name": "Merchant Name",
    "email": "merchant@example.com",
    "role": "MERCHANT"
  },
  "stats": {
    "totalReceived": "$5,000.00",
    "completedPayments": 150,
    "pendingSettlements": 5,
    "activeWallets": 3
  },
  "transactions": [
    {
      "id": "txn_1",
      "reference": "PAY-123",
      "amount": "$50.00",
      "status": "completed",
      "date": "2026-04-06"
    }
  ]
}
```

## Merchant Payment Collection

Merchants can collect payments using any payment endpoint:

`POST /api/payments` - Generic payment
`POST /api/mpesa` - M-Pesa specific
`POST /api/ecocash` - EcoCash specific
`POST /api/mtn` - MTN specific

## Merchant Webhooks

Merchants receive webhook notifications for:
- Payment confirmations
- Settlement updates
- Transaction status changes

Configure webhook URLs in merchant settings.

## Multi-Tenant Merchants

Merchants can operate across multiple tenants:

`GET /api/tenant/memberships` - List all merchant tenants
`POST /api/tenant/switch` - Switch active tenant context

---

# Dashboard API

## Customer Dashboard

`GET /api/dashboard/customer`

Returns dashboard data for authenticated customer.

---

# Debug Endpoints

Development/testing endpoints:

- `GET /api/debug/cookies` - View current cookies
- `GET /api/debug/registration` - Test registration flow

---

# Webhooks

Wallet providers send payment confirmations to webhook endpoints.

## M-Pesa Webhook

`POST /api/webhooks/mpesa`

Payload:
```json
{
  "transactionId": "txn_123",
  "status": "SUCCESS",
  "amount": 50
}
```

## EcoCash Webhook

`POST /api/webhooks/ecocash`

Payload:
```json
{
  "reference": "txn_123",
  "status": "COMPLETED"
}
```

---

# V1 API (Versioned)

The `/api/v1` namespace provides enhanced, versioned endpoints.

## Health Check

`GET /api/v1/health` - Service health status

## Analytics

`GET /api/v1/analytics`

Query Parameters:
- `period` - Time period (24h, 7d, 30d, 90d)

Response:
```json
{
  "data": {
    "period": "7d",
    "transactions": {
      "totalCount": 150,
      "totalAmount": 5000,
      "byStatus": [
        { "status": "completed", "count": 140 },
        { "status": "pending", "count": 10 }
      ]
    },
    "wallets": [
      {
        "id": "wallet-1",
        "type": "mobile_wallet",
        "currency": "USD",
        "balance": 500
      }
    ]
  }
}
```

## API Keys Management

`GET /api/v1/api-keys` - List API keys
`POST /api/v1/api-keys` - Create API key

POST Request:
```json
{
  "name": "Production API Key",
  "permissions": ["read", "write"],
  "expiresInDays": 365
}
```

Response:
```json
{
  "data": {
    "id": "key-123",
    "type": "api-key",
    "attributes": {
      "name": "Production API Key",
      "key": "wpy_abc123...",
      "permissions": ["read", "write"],
      "isActive": true,
      "expiresAt": "2027-04-06T10:00:00Z"
    },
    "_meta": {
      "warning": "Store this key securely. It will not be shown again."
    }
  }
}
```

## Batch Operations

`POST /api/v1/batch`

Execute multiple API operations in a single request (max 50).

Request:
```json
{
  "operations": [
    {
      "id": "op1",
      "method": "GET",
      "path": "/api/v1/wallets/balance",
      "params": { "currency": "USD" }
    },
    {
      "id": "op2",
      "method": "GET",
      "path": "/api/v1/transactions",
      "params": { "page": "1", "limit": "10" }
    }
  ]
}
```

Response:
```json
{
  "results": [
    {
      "id": "op1",
      "status": 200,
      "body": { "balance": 500 }
    },
    {
      "id": "op2",
      "status": 200,
      "body": { "transactions": [...] }
    }
  ],
  "_meta": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

## KYC (Know Your Customer)

- `POST /api/v1/kyc/submit` - Submit KYC documents
- `GET /api/v1/kyc/status` - Check KYC status

## Notifications

`GET /api/v1/notifications/preferences` - Get/update notification preferences

## Payment Routing

`POST /api/v1/routing/payment`

Intelligent payment routing with automatic provider selection.

Request:
```json
{
  "amount": 100,
  "currency": "USD",
  "phoneNumber": "254712345678",
  "country": "KE",
  "reference": "PAY-123",
  "routingStrategy": "LOWEST_FEE",
  "maxRetries": 3
}
```

Response:
```json
{
  "success": true,
  "transactionId": "txn-123",
  "provider": "mpesa",
  "status": "pending",
  "routing": {
    "selectedProvider": "mpesa",
    "routingReason": "Lowest fee for KES transactions",
    "score": 95,
    "estimatedFee": 2.50,
    "successProbability": 0.98,
    "alternatives": [
      { "provider": "airtel", "score": 85 }
    ]
  }
}
```

`GET /api/v1/routing/payment` - Get fee quotes

Query Parameters:
- `amount` - Transaction amount
- `currency` - Currency code
- `country` - Destination country

## Routing Health

- `GET /api/v1/routing/health` - Provider health status
- `GET /api/v1/routing/cross-border` - Cross-border routing options

## Tasks Management

- `GET /api/v1/tasks` - List async tasks
- `GET /api/v1/tasks/[id]` - Get task status
- `POST /api/v1/tasks` - Create task

## Users Management

- `GET /api/v1/users` - List users (admin)
- `GET /api/v1/users/[id]` - Get user details
- `PUT /api/v1/users/[id]` - Update user
- `DELETE /api/v1/users/[id]` - Delete user

## Wallets (V1)

`GET /api/v1/wallets/balance`

Query Parameters:
- `currency` - Specific currency (optional)
- `all` - Return all wallets (true/false)

Response (single):
```json
{
  "success": true,
  "data": {
    "id": "wallet-123",
    "currency": "USD",
    "balance": 500.00,
    "availableBalance": 450.00,
    "pendingBalance": 50.00
  }
}
```

Response (all):
```json
{
  "success": true,
  "balances": [
    {
      "id": "wallet-1",
      "currency": "USD",
      "balance": 500.00,
      "availableBalance": 450.00
    },
    {
      "id": "wallet-2",
      "currency": "KES",
      "balance": 10000.00,
      "availableBalance": 10000.00
    }
  ],
  "totalUSD": 585.50
}
```

### Wallet Operations

- `POST /api/v1/wallets/fund` - Add funds to wallet
- `POST /api/v1/wallets/withdraw` - Withdraw from wallet
- `GET /api/v1/wallets/history` - Transaction history

## Transfers (V1)

- `GET /api/v1/transfers` - List transfers
- `POST /api/v1/transfers` - Create transfer
- `GET /api/v1/transfers/[id]` - Get transfer details
- `POST /api/v1/transfers/p2p` - Peer-to-peer transfer

## Transactions (V1)

`GET /api/v1/transactions` - List transactions with pagination

## Payments (V1)

- `GET /api/v1/payments` - List payments
- `POST /api/v1/payments` - Create payment
- `GET /api/v1/payments/[id]` - Get payment details

## Webhooks (V1)

Provider webhook endpoints:

- `POST /api/v1/webhooks/mpesa` - M-Pesa callbacks
- `POST /api/v1/webhooks/ecocash` - EcoCash callbacks
- `POST /api/v1/webhooks/mtn` - MTN callbacks
- `POST /api/v1/webhooks/flutterwave` - Flutterwave callbacks
- `POST /api/v1/webhooks/paystack` - Paystack callbacks

## Admin Endpoints

- `GET /api/v1/admin/stats` - Platform statistics
- `GET /api/v1/admin/compliance` - Compliance reports
- `GET /api/v1/admin/transfers` - All transfers (admin view)

## API Schemas

`GET /api/v1/schemas` - Get OpenAPI/JSON schemas

## Options

`GET /api/v1/options` - Get API configuration options

---

# Error Responses

Standard error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common error codes:
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error
- `PAYMENT_FAILED` - Payment processing failed
- `INSUFFICIENT_FUNDS` - Not enough balance
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

# Common Features

## Pagination

List endpoints support pagination:

Query Parameters:
- `page` - Page number (default: 1)
- `perPage` or `limit` - Items per page (default: 20)

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Idempotency

Payment endpoints support idempotency:

Header:
```
Idempotency-Key: unique-request-id
```

## Rate Limiting

Default limits:
- 100 requests per minute per user
- 1000 requests per hour per API key

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Caching

Cache-Control headers indicate caching policy:
- `private, max-age=300` - Cache for 5 minutes
- `no-cache` - Don't cache

## CORS

CORS enabled for configured origins.

## Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

# API Versioning

Current version: `v1`

Version strategy:
- `/api` - Legacy endpoints (maintained for compatibility)
- `/api/v1` - Current stable version
- `/api/v2` - Future version (when available)

Breaking changes will be introduced in new versions only.
