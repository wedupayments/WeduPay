# WeduPay — System Architecture Overview

## Purpose

WeduPay is a tuition payment gateway that enables BYU-Pathway students in Africa to pay
their USD-denominated tuition using local mobile money services (Ecocash, Mpesa, etc.).
The system handles currency conversion, payment collection, and settlement to the
institution — abstracting the complexity of cross-currency, multi-provider payment
infrastructure away from the student.

---

## System Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                          WeduPay System                             │
│                                                                     │
│   ┌─────────────────┐          ┌──────────────────────────────┐    │
│   │   Frontend      │  HTTPS   │        Backend API           │    │
│   │   (Next.js)     │◄────────►│        (NestJS)              │    │
│   │                 │  REST    │                              │    │
│   │  Presentation   │          │  Business Logic + Finance    │    │
│   │  only           │          │  State + Provider Adapters   │    │
│   └─────────────────┘          └──────────────┬───────────────┘    │
│                                               │                    │
└───────────────────────────────────────────────┼────────────────────┘
                                                │
              ┌─────────────────────────────────┼──────────────────┐
              │                                 │                  │
              ▼                                 ▼                  ▼
     ┌─────────────────┐            ┌──────────────────┐  ┌──────────────┐
     │   Supabase      │            │  Payment         │  │  BYU-Pathway │
     │   (Auth/JWT     │            │  Providers       │  │  (Institution│
     │   issuance      │            │  Ecocash, Mpesa  │  │   Recipient) │
     │   only)         │            │  Ozow, etc.      │  │              │
     └─────────────────┘            └──────────────────┘  └──────────────┘
```

---

## Actors

| Actor | Role |
|---|---|
| **Student** | Pays tuition in local currency via mobile money |
| **Institution** | BYU-Pathway — receives USD settlement |
| **WeduPay Operator** | Internal admin — monitors, reconciles, manages settlement |
| **Payment Provider** | Ecocash, Mpesa, Ozow — collects local currency from student |
| **Supabase** | Issues and signs JWTs for student authentication only |

---

## Core Transaction Flow

```
Student                  Frontend               Backend                 Provider
   │                        │                      │                       │
   │  1. Log in             │                      │                       │
   │───────────────────────►│                      │                       │
   │                        │  2. Verify JWT       │                       │
   │                        │─────────────────────►│                       │
   │                        │  3. Session token    │                       │
   │                        │◄─────────────────────│                       │
   │                        │                      │                       │
   │  4. Enter USD amount   │                      │                       │
   │───────────────────────►│                      │                       │
   │                        │  5. Request FX quote │                       │
   │                        │─────────────────────►│                       │
   │                        │  6. Locked quote     │                       │
   │                        │  (15 min expiry)     │                       │
   │                        │◄─────────────────────│                       │
   │  7. Show rate + total  │                      │                       │
   │◄───────────────────────│                      │                       │
   │                        │                      │                       │
   │  8. Confirm payment    │                      │                       │
   │───────────────────────►│                      │                       │
   │                        │  9. Create order     │                       │
   │                        │─────────────────────►│                       │
   │                        │                      │  10. Initiate STK    │
   │                        │                      │  push / collection   │
   │                        │                      │─────────────────────►│
   │  11. Approve on phone  │                      │                       │
   │───────────────────────────────────────────────────────────────────►  │
   │                        │                      │                       │
   │                        │                      │◄─────────────────────│
   │                        │                      │  12. Webhook callback │
   │                        │                      │                       │
   │                        │                      │  13. Write ledger     │
   │                        │                      │  entries (immutable)  │
   │                        │                      │                       │
   │                        │  14. Payment status  │                       │
   │◄───────────────────────│◄─────────────────────│                       │
```

---

## Architectural Principles

### 1. Backend owns all financial state
The frontend never writes to the ledger, calculates balances, or transitions payment
state. It submits requests and displays results.

### 2. FX rate is a locked contract
When a student confirms a payment, the exchange rate is locked with a timestamp and
expiry. This rate is stored immutably with the payment order. Rate movements after
confirmation are absorbed by the operator, not passed to the student.

### 3. Providers are adapters, not dependencies
Every payment provider (Ecocash, Mpesa, Ozow) implements a common interface. The core
payment logic has no knowledge of which provider it's using. Adding a new provider is
adding a new adapter — not changing core logic.

### 4. Countries are configuration
Zimbabwe and South Africa in Phase 1 are country configs: supported providers,
currencies, limits, and regulatory rules. Phase 2 adds new country configs. The core
system does not change.

### 5. Webhooks are ingested, not processed immediately
When a provider sends a callback, the backend stores the raw event and queues it for
processing. The webhook endpoint returns 200 immediately. Processing happens
asynchronously in a background worker. This prevents data loss and makes the system
resilient to processing failures.

### 6. Supabase is isolated to one module
Only the `AuthModule` in the backend knows Supabase exists. All other modules receive
a resolved user context — they never interact with Supabase directly. Replacing
Supabase later is a one-module change.

### 7. Every financial mutation is idempotent
Payment initiation, status updates, ledger writes — all carry an idempotency key.
Duplicate requests from retries or network failures produce the same result without
creating duplicate records.

---

## Phase Structure

### Phase 1 — Zimbabwe (+ South Africa)
- Students: BYU-Pathway Zimbabwe students
- Providers: Ecocash (ZW), Ozow or PayFast (SA)
- Currencies: ZWL/ZiG → USD, ZAR → USD
- Institution: BYU-Pathway (single recipient)

### Phase 2+ — Expansion
- New countries added as country config files
- New providers added as provider adapter implementations
- New institutions onboarded via institution configuration
- Core financial engine unchanged

---

## Inter-System Communication

| From | To | Protocol | Auth |
|---|---|---|---|
| Frontend | Backend API | HTTPS REST | Bearer JWT (Supabase-issued) |
| Backend | Supabase | HTTPS | Service role key (server only) |
| Backend | Payment Providers | HTTPS | Provider API keys (server only) |
| Payment Providers | Backend (webhooks) | HTTPS POST | Webhook signature (HMAC) |
| Backend | Institution | TBD (API or SFTP) | Institution credentials |
| Backend | Redis | TCP (internal) | Internal network only |
| Backend | PostgreSQL | TCP (internal) | DB credentials (server only) |

---

## Security Boundaries

- Payment provider API keys: backend environment variables only, never in frontend
- Supabase service role key: backend environment variables only, never in frontend
- FX rate calculations: backend only, never trusted from client
- Permission enforcement: backend guards on every protected endpoint
- Webhook signature validation: required before any webhook payload is processed
- All financial state changes: wrapped in database transactions (ACID)
