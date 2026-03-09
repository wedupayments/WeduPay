# Fintech Platform – API Specification

## Overview

This document defines the REST API endpoints used by the fintech platform.

API endpoints support:

- payments
- wallet transfers
- transaction history
- card operations
- webhooks

All APIs return JSON responses.

Base API path:

/api

---

# Authentication

All protected endpoints require authentication.

Header:

Authorization: Bearer <token>

Example:

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

---

# Payments API

## Create Payment

Endpoint:

POST /api/payments

Description:

Initiates a mobile wallet payment.

Request Body:

{
  "wallet": "mpesa",
  "phone": "254712345678",
  "amount": 50,
  "currency": "KES"
}

Response:

{
  "status": "pending",
  "transactionId": "txn_123456"
}

---

# Transfers API

## Wallet to Wallet Transfer

Endpoint:

POST /api/transfers

Description:

Transfers funds between wallets.

Request Body:

{
  "sourceWallet": "mpesa",
  "destinationWallet": "ecocash",
  "amount": 100,
  "currency": "USD",
  "recipient": "263771234567"
}

Response:

{
  "status": "processing",
  "transferId": "tr_987654"
}

---

# Wallets API

## Get Wallet Balance

Endpoint:

GET /api/wallets/balance

Response:

{
  "wallet": "mpesa",
  "balance": 240.50,
  "currency": "KES"
}

---

# Transactions API

## List Transactions

Endpoint:

GET /api/transactions

Query Parameters:

page  
limit  

Example:

GET /api/transactions?page=1&limit=20

Response:

{
  "transactions": [
    {
      "id": "txn_1",
      "amount": 50,
      "currency": "KES",
      "status": "completed"
    }
  ]
}

---

# Cards API

## Create Virtual Card

Endpoint:

POST /api/cards

Request:

{
  "currency": "USD"
}

Response:

{
  "cardId": "card_123",
  "status": "active"
}

---

# Webhooks

Wallet providers send payment confirmations to webhook endpoints.

## M-Pesa Webhook

Endpoint:

POST /api/webhooks/mpesa

Payload example:

{
  "transactionId": "txn_123",
  "status": "SUCCESS",
  "amount": 50
}

Response:

{
  "received": true
}

---

## EcoCash Webhook

Endpoint:

POST /api/webhooks/ecocash

Payload example:

{
  "reference": "txn_123",
  "status": "COMPLETED"
}

Response:

{
  "received": true
}

---

# Error Responses

Standard error response format:

{
  "error": {
    "code": "invalid_request",
    "message": "Invalid wallet type"
  }
}

Common error codes:

invalid_request  
unauthorized  
payment_failed  
wallet_unavailable

---

# Idempotency

Payment endpoints support idempotency.

Header:

Idempotency-Key: unique-request-id

This prevents duplicate transactions.

---

# Rate Limiting

API requests are rate limited.

Example limits:

100 requests per minute per user

Rate limiting enforced via proxy layer.

---

# Pagination

List endpoints support pagination.

Parameters:

page  
limit  

Example:

GET /api/transactions?page=1&limit=10

---

# Versioning

Future API versions will use:

/api/v1/
/api/v2/

---

# Summary

The API layer provides:

secure payment operations  
wallet interoperability  
clear request structure  
consistent error handling
