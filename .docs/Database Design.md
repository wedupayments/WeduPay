# Fintech Platform – Database Schema

## Overview

This document describes the database design used by the fintech platform.

The system uses:

- PostgreSQL
- Prisma ORM
- Double-entry ledger accounting

The ledger ensures that **every financial movement is recorded and auditable**.

Core entities:

- Users
- Wallets
- Transactions
- Ledger Entries
- P2PTransfers
- TransferRecipients
- Cards
- Webhooks

---

# Design Principles

The database follows financial system best practices.

Key principles:

1. **Double-entry bookkeeping**
2. **Immutable ledger records**
3. **Transaction traceability**
4. **Auditability**

Every financial transaction must create **two ledger entries**:

- Debit
- Credit

Example:

User sends $100

Debit: User Wallet  
Credit: Platform Settlement Account

---

# Entity Relationship Overview

Users
  ↓
Wallets
  ↓
Transactions
  ↓
Ledger Entries

Additional entities:

Cards  
Webhook Events

---

# Users Table

Stores registered platform users.

Fields:

id (uuid)  
email (string)  
phone_number (string)  
country (string)  
kyc_status (string)  
created_at (timestamp)

Example:

| id | email | phone_number | country | kyc_status |
|----|------|-------------|--------|-----------|
| 1 | user@email.com | +254712000000 | KE | verified |

---

# Wallets Table

Represents wallet accounts linked to users.

Fields:

id (uuid)  
user_id (uuid)  
wallet_type (string)  
currency (string)  
balance (decimal)  
created_at (timestamp)

Wallet types:

- mpesa
- ecocash
- mtn_momo
- airtel_money
- pawapay

Provider policy:

- `ecocash` is the direct official EcoCash rail for Zimbabwe.
- `pawapay` is the regional aggregator rail for supported non-Zimbabwe countries.
- Paynow is not modeled as an active provider because the platform uses official EcoCash API access directly.

Example:

| id | user_id | wallet_type | currency | balance |
|----|--------|------------|---------|--------|
| 1 | user1 | mpesa | KES | 500 |

---

# Transactions Table

Tracks all payment or transfer events.

Fields:

id (uuid)  
user_id (uuid)  
amount (decimal)  
currency (string)  
type (string)  
status (string)  
reference (string)  
metadata (json)  
created_at (timestamp)

Transaction types:

| Type | Description |
|------|-------------|
| `PAYMENT` | Incoming merchant payment |
| `TRANSFER` | Internal wallet-to-wallet transfer |
| `TRANSFER_RECEIVED` | Counterpart record created in the recipient's ledger when they receive a transfer |
| `FUNDING` | Wallet top-up deposit |
| `WITHDRAWAL` | Wallet withdrawal to mobile money |
| `P2P_TRANSFER` | Cross-border P2P transfer (see P2PTransfer table) |

Transaction statuses:

| Status | Description |
|--------|-------------|
| `PENDING` | Initiated, not yet processed |
| `PROCESSING` | Dispatched to payment provider, awaiting confirmation |
| `COMPLETED` | Successfully delivered |
| `FAILED` | Failed; wallet refunded if applicable |

For `P2P_TRANSFER` records, the `metadata` JSON field contains:

```json
{
  "recipientPhone": "255712345678",
  "recipientCountry": "TZ",
  "receiveAmount": 91875,
  "receiveCurrency": "TZS",
  "exchangeRate": 19.45,
  "p2pTransferId": "transfer-uuid"
}
```

Example:

| id | user_id | amount | currency | type | status |
|----|--------|-------|---------|------|--------|
| txn1 | user1 | 5125 | KES | P2P_TRANSFER | COMPLETED |

---

# P2PTransfer Table

Stores cross-border P2P transfer records. Created atomically alongside the wallet debit and Transaction ledger entry.

Fields:

id (uuid)  
userId (uuid) — sender  
transferRef (string) — e.g. `P2P-1714567890-abc`  
sendAmount (decimal)  
sendCurrency (string)  
receiveAmount (decimal)  
receiveCurrency (string)  
exchangeRate (decimal)  
totalDebit (decimal) — sendAmount + all fees  
transferFee (decimal)  
fxFee (decimal)  
senderPhone (string)  
senderCountry (string)  
recipientPhone (string)  
recipientName (string)  
recipientCountry (string)  
recipientWalletType (string)  
provider (string) — e.g. `flutterwave`, `WEDUPAY_INTERNAL`  
providerReference (string, nullable)  
status (string) — `PROCESSING` → `COMPLETED` / `FAILED` / `PENDING_REVIEW`  
failureReason (string, nullable)  
description (string, nullable)  
complianceRiskScore (integer)  
complianceRiskLevel (string) — `LOW` / `MEDIUM` / `HIGH`  
transactionId (uuid, nullable) — FK to Transaction table  
createdAt (timestamp)  
completedAt (timestamp, nullable)

Transfer statuses:

| Status | Wallet State | Description |
|--------|-------------|-------------|
| `PROCESSING` | Debited | Payment dispatched to provider |
| `COMPLETED` | Debited (final) | Funds delivered to recipient |
| `FAILED` | Refunded | Provider failure; wallet balance restored atomically |
| `PENDING_REVIEW` | Debited + held | Risk score ≥ 60; manual compliance review required |

The sender's wallet is **always debited before** the provider is called. If the provider fails (exception or `success: false` response), the wallet debit is reversed in the same Prisma transaction that updates the transfer status to `FAILED`.

Prisma model:

```prisma
model P2PTransfer {
  id                  String    @id @default(uuid())
  userId              String
  transferRef         String    @unique
  sendAmount          Float
  sendCurrency        String
  receiveAmount       Float
  receiveCurrency     String
  exchangeRate        Float
  totalDebit          Float
  transferFee         Float
  fxFee               Float
  senderPhone         String?
  senderCountry       String?
  recipientPhone      String
  recipientName       String?
  recipientCountry    String
  recipientWalletType String    @default("mobile_wallet")
  provider            String
  providerReference   String?
  status              String    @default("PROCESSING")
  failureReason       String?
  description         String?
  complianceRiskScore Int       @default(0)
  complianceRiskLevel String    @default("LOW")
  transactionId       String?
  createdAt           DateTime  @default(now())
  completedAt         DateTime?

  user User @relation(fields: [userId], references: [id])
}
```

Example:

| transferRef | sendAmount | sendCurrency | receiveAmount | receiveCurrency | status |
|-------------|-----------|-------------|--------------|----------------|--------|
| P2P-1714567890-abc | 5000 | KES | 91875 | TZS | COMPLETED |

---

# TransferRecipient Table

Stores saved recipients for repeat transfers. Created automatically when `saveRecipient: true` on a successful `POST /api/v1/transfers/p2p`, or manually via `POST /api/v1/transfers/p2p/recipients`.

Fields:

id (uuid)  
userId (uuid) — owner  
name (string)  
phoneNumber (string)  
country (string)  
walletType (string) — default `mobile_wallet`  
lastUsedAt (timestamp, nullable)  
createdAt (timestamp)

A recipient is identified by the (userId, phoneNumber, country) composite — updating an existing recipient updates in place rather than creating a duplicate.

Prisma model:

```prisma
model TransferRecipient {
  id          String    @id @default(uuid())
  userId      String
  name        String
  phoneNumber String
  country     String
  walletType  String    @default("mobile_wallet")
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

---

# Compliance Scoring

Every `executeTransfer` call runs `runComplianceChecks()` before any money moves. Scores accumulate additionally:

| Condition | Score Added |
|-----------|-------------|
| Amount > 5,000 (send currency) | +20 |
| Amount > 10,000 (send currency) | +30 |
| High-risk recipient country | +40 |

**Risk levels:**

| Score Range | Level | Action |
|-------------|-------|--------|
| 0–29 | LOW | Auto-approved, payment dispatched |
| 30–59 | MEDIUM | Auto-approved, monitoring flag set |
| ≥ 60 | HIGH | `PENDING_REVIEW` — funds held, manual review required |

Hard-fail checks (transfer throws before wallet debit if any fail):

| Check | Fails when |
|-------|-----------|
| `amountThreshold` | `totalDebit >= 10,000` in send currency |
| `sanctions` | Placeholder — always passes (production: integrate OFAC/UN API) |
| `fraud` | Placeholder — always passes (production: ML scoring) |

The `complianceRiskScore` and `complianceRiskLevel` fields on the `P2PTransfer` record store the result for audit purposes.

---

# Ledger Entries Table

This is the **core accounting table**.

Every transaction must create at least two ledger entries.

Fields:

id (uuid)  
transaction_id (uuid)  
account_id (uuid)  
entry_type (string)  
amount (decimal)  
currency (string)  
created_at (timestamp)

Entry types:

debit  
credit

Example:

| id | transaction_id | account_id | entry_type | amount |
|----|---------------|-----------|-----------|-------|
| 1 | txn1 | wallet1 | debit | 50 |
| 2 | txn1 | settlement | credit | 50 |

Total debits must equal total credits.

---

# Cards Table

Stores virtual card data.

Fields:

id (uuid)  
user_id (uuid)  
provider (string)  
status (string)  
currency (string)  
created_at (timestamp)

Card statuses:

active  
frozen  
cancelled

Card providers may include platforms like:

- Railsr
- issuing banks

Sensitive card data must **never be stored directly**.

Only store tokenized references.

---

# Webhook Events Table

Stores webhook events from wallet providers.

Fields:

id (uuid)  
provider (string)  
event_type (string)  
payload (json)  
processed (boolean)  
created_at (timestamp)

Example providers:

mpesa  
ecocash  
mtn_momo  
pawapay

This helps with:

- webhook replay
- debugging
- event auditing

---

# Idempotency Keys Table

Prevents duplicate financial transactions.

Fields:

id (uuid)  
key (string)  
request_hash (string)  
created_at (timestamp)

Used for endpoints like:

POST /payments  
POST /transfers

If a duplicate key appears, the request is rejected.

---

# Prisma Schema Example

Example Prisma models.

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  phoneNumber String
  country     String
  kycStatus   String
  createdAt   DateTime @default(now())

  wallets     Wallet[]
  transactions Transaction[]
}

model Wallet {
  id        String @id @default(uuid())
  userId    String
  walletType String
  currency  String
  balance   Float
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model Transaction {
  id        String   @id @default(uuid())
  userId    String
  amount    Float
  currency  String
  status    String   // PENDING | PROCESSING | COMPLETED | FAILED
  type      String   // PAYMENT | TRANSFER | TRANSFER_RECEIVED | FUNDING | WITHDRAWAL | P2P_TRANSFER
  reference String
  metadata  Json?    // For P2P_TRANSFER: recipientPhone, recipientCountry, receiveAmount, receiveCurrency, exchangeRate
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model LedgerEntry {
  id            String @id @default(uuid())
  transactionId String
  accountId     String
  entryType     String
  amount        Float
  currency      String
  createdAt     DateTime @default(now())
}

---

# Financial Integrity Rules

The system enforces the following rules:

1. Every transaction must produce ledger entries.
2. Debit total must equal credit total.
3. Ledger entries are immutable.
4. Transactions cannot be deleted once completed.

This ensures **financial reconciliation and auditing**.

---

# Indexing Strategy

Important indexes:

transactions(user_id)

ledger_entries(transaction_id)

wallets(user_id)

webhook_events(provider)

Indexes improve performance for:

- transaction history
- reconciliation queries
- reporting

---

# Reconciliation

The ledger system allows reconciliation between:

User balances  
Wallet provider balances  
Platform settlement accounts

Example reconciliation query:

Sum(credits) - Sum(debits)

If mismatched, system flags reconciliation error.

---

# Future Enhancements

Possible future database improvements:

multi-currency ledger support

settlement accounts

fraud scoring tables

merchant accounts

reporting tables

---

# Summary

This schema provides:

- secure financial accounting
- transaction traceability
- wallet interoperability
- scalable payment infrastructure

The ledger-based architecture ensures the platform can operate as a **reliable fintech payment system**.
