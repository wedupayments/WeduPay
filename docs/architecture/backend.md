# WeduPay — Backend Architecture

## Responsibility

The backend is the **source of truth for all financial state**. It owns authentication
resolution, payment order lifecycle, FX rate locking, ledger accounting, provider
integrations, settlement, and audit. No financial operation is valid unless it passes
through the backend.

---

## Tech Stack

| Concern | Technology | Reason |
|---|---|---|
| Framework | NestJS (TypeScript) | Module system, DI container, Guards/Interceptors, testable by design |
| Language | TypeScript (strict) | Full type safety, shared types with Prisma-generated models |
| Database | PostgreSQL | ACID transactions, reliable for financial data, proven at scale |
| ORM | Prisma | Type-safe queries, migration tooling, schema as the contract |
| Job queue | BullMQ + Redis | Reliable async processing for webhooks, settlements, notifications |
| Validation | class-validator + class-transformer | DTO-level validation integrated into NestJS pipes |
| Auth | Passport.js (JWT + API Key strategies) | Pluggable auth strategies, integrates natively with NestJS guards |
| API docs | Swagger (OpenAPI via @nestjs/swagger) | Auto-generated from decorators, keeps docs in sync with code |
| Email | Nodemailer (or Resend SDK) | Transactional email for payment confirmations, receipts |
| Testing | Jest + Supertest | Unit tests for services, integration tests for controllers |
| Containerisation | Docker + Docker Compose | Consistent environments for development and deployment |

---

## Architectural Pattern: Layered Module Architecture

Each domain is a NestJS module. Within each module, there are four layers:

```
Controller      → receives HTTP request, validates input DTO, calls service, returns response
Service         → owns business logic and orchestration, calls repositories
Repository      → all database access via Prisma, typed, no business logic
Infrastructure  → external API calls (payment providers, email, FX rate APIs)
```

Modules communicate via injected services — never by importing repositories from
other modules. This keeps domain boundaries clean and testable.

---

## Module Map

```
┌──────────────────────────────────────────────────────────────────┐
│                          AppModule                               │
├──────────┬──────────┬───────────┬──────────┬────────────────────┤
│  Auth    │  Users   │ Payments  │ FxRates  │     Providers      │
│  Module  │  Module  │  Module   │  Module  │     Module         │
├──────────┴──────────┴─────┬─────┴──────────┴────────────────────┤
│   Ledger Module           │     Webhooks Module                  │
├───────────────────────────┤─────────────────────────────────────┤
│   Settlements Module      │     Notifications Module             │
├───────────────────────────┴─────────────────────────────────────┤
│   Admin Module            │     Institutions Module              │
├───────────────────────────┴─────────────────────────────────────┤
│                    Shared / Infrastructure                       │
│   PrismaModule  │  QueueModule  │  ConfigModule                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
│
├── modules/
│   │
│   ├── auth/                           # Authentication and session resolution
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts          # POST /auth/session, DELETE /auth/session
│   │   ├── auth.service.ts             # JWT verification, user resolution, session creation
│   │   ├── strategies/
│   │   │   ├── supabase-jwt.strategy.ts  # Validates Supabase-issued JWTs
│   │   │   └── api-key.strategy.ts       # Validates X-API-Key header for integrations
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # Protects endpoints requiring a valid session
│   │   │   ├── api-key.guard.ts
│   │   │   └── roles.guard.ts            # Enforces role requirements (ADMIN, OPERATOR, etc.)
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts # Extracts resolved user from request context
│   │   │   └── roles.decorator.ts        # @Roles('ADMIN') on controller methods
│   │   └── dto/
│   │       └── resolved-user.dto.ts      # The user context passed to all downstream modules
│   │
│   ├── users/                          # Student profile management
│   │   ├── users.module.ts
│   │   ├── users.controller.ts         # GET /users/me, PATCH /users/me
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── institutions/                   # BYU-Pathway and future institutions
│   │   ├── institutions.module.ts
│   │   ├── institutions.service.ts     # Resolve institution by ID or code
│   │   ├── institutions.repository.ts
│   │   └── dto/
│   │       └── institution.dto.ts
│   │
│   ├── fx-rates/                       # FX rate fetching and quote locking
│   │   ├── fx-rates.module.ts
│   │   ├── fx-rates.controller.ts      # GET /fx-rates/quote
│   │   ├── fx-rates.service.ts         # Fetch live rate, create locked quote with expiry
│   │   ├── fx-rates.repository.ts      # Persist and retrieve rate quotes
│   │   └── dto/
│   │       ├── request-quote.dto.ts    # { fromCurrency, toCurrency, amount }
│   │       └── fx-rate-quote.dto.ts    # { quoteId, rate, localAmount, expiresAt }
│   │
│   ├── payments/                       # Core payment order lifecycle
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts      # POST /payments, GET /payments, GET /payments/:id
│   │   ├── payments.service.ts         # Create order, validate quote, initiate collection
│   │   ├── payments.repository.ts
│   │   └── dto/
│   │       ├── create-payment-order.dto.ts  # { usdAmount, quoteId, providerKey, phoneNumber }
│   │       └── payment-order.dto.ts         # Response shape
│   │
│   ├── providers/                      # Payment provider adapters
│   │   ├── providers.module.ts
│   │   ├── provider.registry.ts        # Maps providerKey → implementation
│   │   ├── base/
│   │   │   └── payment-provider.interface.ts  # Contract every provider must implement
│   │   ├── ecocash/
│   │   │   ├── ecocash.provider.ts     # Implements PaymentProvider for Ecocash
│   │   │   └── ecocash.config.ts       # Ecocash-specific config (endpoints, credentials)
│   │   ├── mpesa/
│   │   │   ├── mpesa.provider.ts
│   │   │   └── mpesa.config.ts
│   │   └── ozow/                       # South Africa
│   │       ├── ozow.provider.ts
│   │       └── ozow.config.ts
│   │
│   ├── webhooks/                       # Inbound provider callbacks
│   │   ├── webhooks.module.ts
│   │   ├── webhooks.controller.ts      # POST /webhooks/:provider
│   │   ├── webhooks.service.ts         # Validate signature, persist raw event, enqueue
│   │   ├── webhooks.repository.ts
│   │   ├── processors/
│   │   │   ├── ecocash.processor.ts    # BullMQ worker: process Ecocash webhook event
│   │   │   ├── mpesa.processor.ts
│   │   │   └── ozow.processor.ts
│   │   └── dto/
│   │       └── webhook-event.dto.ts
│   │
│   ├── ledger/                         # Double-entry accounting
│   │   ├── ledger.module.ts
│   │   ├── ledger.service.ts           # createDoubleEntry, getAccountBalance, verify
│   │   ├── ledger.repository.ts        # Prisma access to LedgerEntry table
│   │   └── types/
│   │       └── ledger.types.ts         # DebitEntry, CreditEntry, AccountBalance
│   │
│   ├── settlements/                    # Settlement batches to BYU-Pathway
│   │   ├── settlements.module.ts
│   │   ├── settlements.controller.ts   # POST /settlements/trigger, GET /settlements
│   │   ├── settlements.service.ts      # Build batch, calculate totals, initiate remittance
│   │   ├── settlements.repository.ts
│   │   └── dto/
│   │       ├── settlement-batch.dto.ts
│   │       └── trigger-settlement.dto.ts
│   │
│   ├── notifications/                  # Email and SMS dispatch
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts    # sendPaymentConfirmation, sendReceipt, sendFailure
│   │   └── templates/
│   │       ├── payment-confirmed.template.ts
│   │       ├── payment-failed.template.ts
│   │       └── settlement-complete.template.ts
│   │
│   └── admin/                          # Operator-facing management APIs
│       ├── admin.module.ts
│       ├── admin.controller.ts         # GET /admin/payments, GET /admin/settlements, etc.
│       └── admin.service.ts
│
├── countries/                          # Country-level configuration
│   ├── zw.config.ts                    # Zimbabwe: providers, currencies, limits, regulations
│   ├── za.config.ts                    # South Africa
│   └── index.ts                        # Country registry: maps countryCode → config
│
├── shared/
│   ├── database/
│   │   ├── prisma.service.ts           # PrismaClient singleton, lifecycle hooks
│   │   └── prisma.module.ts            # Global module, imported once in AppModule
│   │
│   ├── queue/
│   │   ├── queue.module.ts             # BullMQ setup, Redis connection
│   │   └── queue.constants.ts          # Queue name constants
│   │
│   ├── guards/
│   │   └── idempotency.guard.ts        # Checks idempotency key before mutation endpoints
│   │
│   ├── interceptors/
│   │   ├── logging.interceptor.ts      # Request/response logging with request ID
│   │   ├── audit.interceptor.ts        # Writes audit log entry for every mutation
│   │   └── response.interceptor.ts     # Normalises all responses to { data, meta } shape
│   │
│   ├── filters/
│   │   └── http-exception.filter.ts    # Global error handler: maps exceptions to API errors
│   │
│   ├── pipes/
│   │   └── validation.pipe.ts          # Global DTO validation using class-validator
│   │
│   ├── decorators/
│   │   └── idempotency-key.decorator.ts
│   │
│   └── types/
│       ├── common.types.ts             # Currency, Country, PaymentStatus, TransactionType
│       └── api-response.types.ts       # ApiResponse<T>, PaginatedResponse<T>, ApiError
│
├── config/
│   ├── app.config.ts                   # Port, CORS, API prefix
│   ├── database.config.ts              # DATABASE_URL, connection pool settings
│   ├── auth.config.ts                  # JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY
│   ├── queue.config.ts                 # REDIS_URL, queue concurrency
│   └── providers.config.ts             # Per-provider API keys and endpoints
│
├── prisma/
│   ├── schema.prisma                   # Database schema (single source of truth)
│   ├── migrations/                     # Prisma migration history
│   └── seed.ts                         # Development seed data
│
├── app.module.ts                       # Root module: imports all feature modules
└── main.ts                             # Bootstrap: create app, apply global pipes/filters
```

---

## Database Schema (Core Tables)

```
User
  id, supabaseUserId, email, phoneNumber, country, kycStatus, role, createdAt

Institution
  id, name, code, settlementCurrency, settlementAccountDetails, isActive

FxRateQuote
  id, fromCurrency, toCurrency, rate, localAmount, usdAmount, fee,
  expiresAt, usedAt, createdAt

PaymentOrder
  id, userId, institutionId, quoteId, providerKey,
  usdAmount, localAmount, localCurrency, exchangeRate, fee,
  phoneNumber, externalReference, status, idempotencyKey,
  createdAt, completedAt

  status: PENDING | PROCESSING | COMPLETED | FAILED | EXPIRED

WebhookEvent
  id, provider, externalReference, rawPayload, signature,
  status, processedAt, errorMessage, createdAt

  status: RECEIVED | PROCESSING | PROCESSED | FAILED

LedgerEntry
  id, paymentOrderId, accountId, entryType, amount, currency,
  description, createdAt

  entryType: DEBIT | CREDIT
  (Immutable — no updates or deletes ever)

SettlementBatch
  id, institutionId, totalUsdAmount, paymentOrderIds[],
  status, settledAt, reference, createdAt

  status: PENDING | PROCESSING | COMPLETED | FAILED

AuditLog
  id, userId, action, resource, resourceId, ipAddress,
  userAgent, requestId, createdAt
```

---

## Provider Interface Contract

Every payment provider implements this interface. The `PaymentsService` and
webhook processors interact with this interface only — never with a concrete class.

```typescript
interface PaymentProvider {
  readonly key: string;                    // 'ecocash' | 'mpesa' | 'ozow'
  readonly supportedCurrencies: string[];  // ['ZWL', 'ZiG', 'USD']
  readonly countryCodes: string[];         // ['ZW']

  initiateCollection(
    order: PaymentOrder,
    phoneNumber: string,
    localAmount: number,
    currency: string
  ): Promise<ProviderInitiateResult>;

  checkStatus(
    externalReference: string
  ): Promise<ProviderStatusResult>;

  verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean;

  parseWebhookEvent(
    rawPayload: unknown
  ): ParsedWebhookEvent;
}
```

Adding a new provider for Phase 2 = implement this interface + register in
`provider.registry.ts` + add country config. No other changes required.

---

## Webhook Processing Pattern

Webhooks are never processed synchronously. The flow is:

```
1. Provider sends POST /webhooks/:provider
2. Controller validates HMAC signature immediately
3. Raw payload saved to WebhookEvent table (status: RECEIVED)
4. Event enqueued to BullMQ (fire-and-forget)
5. Controller returns 200 OK to provider

[Async — in background worker]
6. Processor dequeues event
7. Parses provider-specific payload
8. Looks up PaymentOrder by externalReference
9. Validates idempotency (already processed? return early)
10. Transitions PaymentOrder status
11. Writes immutable LedgerEntry (double-entry)
12. Marks WebhookEvent as PROCESSED
13. Enqueues notification job
```

If step 6–13 fails, BullMQ retries with exponential backoff. The raw event is
always preserved. No payment can be lost due to a processing error.

---

## FX Rate Quote Lifecycle

```
1. GET /fx-rates/quote?from=ZWL&to=USD&amount=4200
2. FxRateService fetches live rate from exchange rate provider
3. Applies WeduPay fee/spread
4. Creates FxRateQuote record: { rate, localAmount, usdAmount, expiresAt: +15min }
5. Returns quoteId to frontend

[Student confirms payment — within 15 min]
6. POST /payments { quoteId, ... }
7. PaymentsService validates: quote exists, not expired, not already used
8. PaymentsService atomically: marks quote as used, creates PaymentOrder, calls provider
9. If quote expired: reject with 410 Gone — student must request new quote
```

The exchange rate is frozen at step 4. Steps 1–9 are within a database transaction.

---

## API Surface (Phase 1)

### Auth
```
POST   /auth/session                # Verify Supabase JWT, create session
DELETE /auth/session                # Logout
GET    /auth/session                # Current session info
```

### Users
```
GET    /users/me                    # Current student profile
PATCH  /users/me                    # Update profile
```

### FX Rates
```
GET    /fx-rates/quote              # Request locked FX quote
```

### Payments
```
POST   /payments                    # Initiate payment order
GET    /payments                    # Student payment history (paginated)
GET    /payments/:id                # Single payment order status
```

### Webhooks
```
POST   /webhooks/ecocash            # Ecocash payment callback
POST   /webhooks/mpesa              # Mpesa payment callback
POST   /webhooks/ozow               # Ozow payment callback
```

### Settlements (Operator)
```
GET    /settlements                 # List settlement batches
POST   /settlements/trigger         # Manually trigger settlement run
GET    /settlements/:id             # Batch detail
```

### Admin
```
GET    /admin/payments              # All payment orders (filterable)
GET    /admin/payments/:id          # Order detail with full audit trail
GET    /admin/stats                 # Aggregate counts, volumes
```

---

## Environment Variables

```bash
# Application
PORT=
NODE_ENV=

# Database
DATABASE_URL=

# Auth
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only — never in frontend
JWT_SECRET=

# Queue
REDIS_URL=

# Payment Providers
ECOCASH_MERCHANT_CODE=
ECOCASH_API_KEY=
ECOCASH_WEBHOOK_SECRET=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_WEBHOOK_SECRET=
OZOW_SITE_CODE=
OZOW_PRIVATE_KEY=
OZOW_WEBHOOK_SECRET=

# FX Rate Provider
OPEN_EXCHANGE_RATES_API_KEY=

# Notifications
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
NOTIFICATION_FROM_EMAIL=
```

No environment variable from this list is ever sent to the browser.

---

## Country Configuration Shape

```typescript
interface CountryConfig {
  code: string;                      // 'ZW'
  name: string;                      // 'Zimbabwe'
  localCurrencies: string[];         // ['ZWL', 'ZiG', 'USD']
  settlementCurrency: string;        // 'USD'
  supportedProviders: string[];      // ['ecocash']
  paymentLimits: {
    minUsd: number;                  // 5
    maxUsd: number;                  // 2000
  };
  feeRules: {
    spreadPercent: number;           // 1.5  (applied to FX rate)
    fixedFeeUsd: number;             // 0.50
  };
}
```

Adding Kenya in Phase 2: create `ke.config.ts`, implement `MpesaProvider` (if not
already done), register both. Zero changes to core payment, ledger, or settlement logic.

---

## Phase 1 Scope

Modules to implement in Phase 1:

- `auth` — JWT validation, session resolution
- `users` — student profile CRUD
- `institutions` — seed BYU-Pathway as the single institution
- `fx-rates` — quote generation and locking
- `payments` — order creation and lifecycle
- `providers/ecocash` — Zimbabwe
- `providers/ozow` — South Africa (if Phase 1 includes SA)
- `webhooks` — ingestion + processors for Phase 1 providers
- `ledger` — double-entry on payment completion
- `settlements` — batch settlement to BYU-Pathway
- `notifications` — payment confirmation and receipt emails
- `admin` — read-only payment list and manual settlement trigger

Modules deferred to Phase 2+:
- `providers/mpesa` — Kenya
- Additional country configs
- Multi-institution configuration UI
- Automated reconciliation against institution statement
