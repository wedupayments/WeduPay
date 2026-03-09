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
created_at (timestamp)

Transaction types:

payment  
transfer  
withdrawal  
deposit

Transaction statuses:

pending  
processing  
completed  
failed

Example:

| id | user_id | amount | currency | status |
|----|--------|-------|---------|--------|
| txn1 | user1 | 50 | USD | completed |

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
  status    String
  type      String
  reference String
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
