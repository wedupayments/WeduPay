# Technical Design Document: Merchant Dashboard Enhancements

## Overview

This design document specifies the technical architecture for enhancing the WeduPay merchant dashboard with real database-backed functionality. The enhancements replace mock data with actual Prisma queries, implement payment link generation with secure URL handling, add real-time analytics visualizations, connect settlement/payout workflows, implement webhook management with signature verification, and add comprehensive export functionality.

The system leverages the existing Next.js App Router architecture, Prisma ORM for database access, and Supabase for authentication. All features maintain multi-tenant isolation through tenantId scoping and follow the platform's double-entry ledger accounting principles.

### Key Design Goals

- Replace all mock data with real database queries filtered by tenantId
- Implement secure payment link generation with cryptographic identifiers
- Provide real-time analytics with efficient aggregation queries
- Enable merchant-initiated payouts with balance validation
- Support webhook configuration with HMAC-SHA256 signature verification
- Generate exportable reports in CSV and Excel formats with async processing for large datasets
- Maintain performance through caching, indexing, and query optimization
- Ensure security through tenant isolation, input validation, and webhook signatures

## Architecture

### System Components

The merchant dashboard enhancements introduce several new architectural layers:

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  (Charts, Export UI, Webhook Management, Payment Links) │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                   API Route Handlers                     │
│     (/api/v1/analytics, /api/v1/payment-links, etc)    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                    Service Layer                         │
│  (AnalyticsService, PaymentLinkService, ExportService)  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                  Repository Layer                        │
│        (TransactionRepo, PaymentLinkRepo, etc)          │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                   Prisma Client                          │
│              (Database ORM Layer)                        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                PostgreSQL Database                       │
│   (Transactions, PaymentLinks, Settlements, Webhooks)   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Transaction Query Flow**: Dashboard → API → TransactionService → Prisma → Database
2. **Payment Link Creation**: Form → API → PaymentLinkService → Crypto Generation → Database
3. **Analytics Aggregation**: Chart Component → API → AnalyticsService → Cached Aggregates → Database
4. **Settlement Request**: Payout Form → API → SettlementService → Balance Validation → Wallet Update
5. **Webhook Delivery**: Event Trigger → WebhookService → HMAC Signature → HTTP POST → Retry Queue
6. **Export Generation**: Export Request → AsyncTask → ExportService → File Generation → Download Link

### Multi-Tenant Architecture

All database queries are scoped by tenantId to ensure data isolation:

```typescript
// Example tenant-scoped query
const transactions = await prisma.transaction.findMany({
  where: {
    tenantId: currentTenantId,
    status: 'completed'
  }
});
```

Tenant context is extracted from the authenticated session and validated on every request.

## Components and Interfaces

### Database Schema Changes

#### New Table: PaymentLink

```prisma
model PaymentLink {
  id              String    @id @default(uuid())
  linkId          String    @unique  // Cryptographically secure identifier
  tenantId        String
  userId          String
  amount          Float
  currency        String
  description     String?
  expiresAt       DateTime?
  usageLimit      Int?      // null = unlimited
  usageCount      Int       @default(0)
  status          String    @default("ACTIVE")  // ACTIVE, EXPIRED, INACTIVE
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  transactions    Transaction[]
  
  @@index([tenantId])
  @@index([linkId])
  @@index([status])
  @@index([expiresAt])
  @@map("payment_links")
}
```

#### New Table: Settlement

```prisma
model Settlement {
  id                String    @id @default(uuid())
  tenantId          String
  userId            String
  amount            Float
  currency          String
  status            String    @default("PENDING")  // PENDING, PROCESSING, COMPLETED, FAILED
  settlementPeriod  String    // DAILY, WEEKLY, MONTHLY
  requestedAt       DateTime  @default(now())
  processedAt       DateTime?
  completedAt       DateTime?
  failureReason     String?
  bankAccount       Json?     // Bank account details
  transactionIds    String[]  // Array of transaction IDs included
  
  @@index([tenantId])
  @@index([userId])
  @@index([status])
  @@index([requestedAt])
  @@map("settlements")
}
```

#### New Table: WebhookEndpoint

```prisma
model WebhookEndpoint {
  id              String    @id @default(uuid())
  tenantId        String
  userId          String
  url             String
  description     String?
  secretKey       String    // For HMAC signature generation
  events          String[]  // Array of subscribed event types
  isActive        Boolean   @default(true)
  lastTestedAt    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  deliveries      WebhookDelivery[]
  
  @@index([tenantId])
  @@index([isActive])
  @@map("webhook_endpoints")
}
```

#### New Table: WebhookDelivery

```prisma
model WebhookDelivery {
  id              String    @id @default(uuid())
  endpointId      String
  eventType       String
  payload         Json
  signature       String    // HMAC-SHA256 signature
  status          String    @default("PENDING")  // PENDING, SUCCESS, FAILED
  httpStatus      Int?
  responseTime    Float?    // milliseconds
  attemptNumber   Int       @default(1)
  maxAttempts     Int       @default(3)
  nextRetryAt     DateTime?
  errorMessage    String?
  createdAt       DateTime  @default(now())
  deliveredAt     DateTime?
  
  // Relations
  endpoint        WebhookEndpoint @relation(fields: [endpointId], references: [id])
  
  @@index([endpointId])
  @@index([status])
  @@index([nextRetryAt])
  @@map("webhook_deliveries")
}
```

#### New Table: ExportJob

```prisma
model ExportJob {
  id              String    @id @default(uuid())
  tenantId        String
  userId          String
  type            String    // TRANSACTIONS, ANALYTICS, SETTLEMENTS
  format          String    // CSV, EXCEL
  filters         Json      // Applied filters (date range, status, etc)
  status          String    @default("PENDING")  // PENDING, PROCESSING, COMPLETED, FAILED
  recordCount     Int?
  fileUrl         String?
  fileSize        Int?      // bytes
  expiresAt       DateTime?
  errorMessage    String?
  createdAt       DateTime  @default(now())
  completedAt     DateTime?
  
  @@index([tenantId])
  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@map("export_jobs")
}
```

#### New Table: AnalyticsCache

```prisma
model AnalyticsCache {
  id              String    @id @default(uuid())
  tenantId        String
  cacheKey        String    // Composite key: metric_type:date_range:filters
  metricType      String    // REVENUE, SUCCESS_RATE, PAYMENT_METHODS, GEO_DISTRIBUTION
  data            Json      // Cached aggregated data
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  
  @@unique([tenantId, cacheKey])
  @@index([tenantId])
  @@index([expiresAt])
  @@map("analytics_cache")
}
```

#### Modified Table: Transaction

Add relation to PaymentLink:

```prisma
model Transaction {
  // ... existing fields ...
  paymentLinkId   String?
  paymentLink     PaymentLink? @relation(fields: [paymentLinkId], references: [id])
  
  @@index([paymentLinkId])
}
```

### API Endpoints

#### Transaction Endpoints

**GET /api/v1/transactions**
- Query Parameters: `page`, `limit`, `status`, `dateFrom`, `dateTo`, `currency`, `type`
- Returns: Paginated transaction list with user relations
- Authentication: Required
- Tenant Scoping: Automatic via middleware

**GET /api/v1/transactions/stats**
- Query Parameters: `dateFrom`, `dateTo`
- Returns: Aggregate statistics (total count, successful count, total revenue)
- Authentication: Required

#### Payment Link Endpoints

**POST /api/v1/payment-links**
- Body: `{ amount, currency, description?, expiresAt?, usageLimit? }`
- Returns: `{ linkId, url, ...metadata }`
- Authentication: Required
- Generates cryptographically secure linkId using `crypto.randomBytes(32)`

**GET /api/v1/payment-links**
- Query Parameters: `page`, `limit`, `status`
- Returns: Paginated payment links with usage metrics
- Authentication: Required

**GET /api/v1/payment-links/:linkId**
- Returns: Payment link details with conversion metrics
- Authentication: Required

**PATCH /api/v1/payment-links/:linkId**
- Body: `{ status?, usageLimit?, expiresAt? }`
- Returns: Updated payment link
- Authentication: Required

**GET /pay/:linkId** (Public endpoint)
- Returns: Payment form page if link is valid and active
- Validates: expiry, usage limit, status
- No authentication required

#### Analytics Endpoints

**GET /api/v1/analytics/revenue**
- Query Parameters: `dateFrom`, `dateTo`, `granularity` (daily/weekly/monthly)
- Returns: Time-series revenue data
- Authentication: Required
- Caching: 5 minutes

**GET /api/v1/analytics/payment-methods**
- Query Parameters: `dateFrom`, `dateTo`
- Returns: Payment method distribution with percentages
- Authentication: Required
- Caching: 5 minutes

**GET /api/v1/analytics/geography**
- Query Parameters: `dateFrom`, `dateTo`
- Returns: Transaction volume by country
- Authentication: Required
- Caching: 5 minutes

**GET /api/v1/analytics/success-rate**
- Query Parameters: `dateFrom`, `dateTo`, `granularity`
- Returns: Success rate trend over time
- Authentication: Required
- Caching: 5 minutes

#### Settlement Endpoints

**GET /api/v1/settlements/balance**
- Returns: Available balance, pending settlements, next settlement date
- Authentication: Required

**POST /api/v1/settlements/request**
- Body: `{ amount, currency, bankAccount }`
- Returns: Settlement record
- Authentication: Required
- Validates: amount <= available balance, no duplicate for period

**GET /api/v1/settlements**
- Query Parameters: `page`, `limit`, `status`
- Returns: Paginated settlement history
- Authentication: Required

**GET /api/v1/settlements/:id**
- Returns: Settlement details with transaction list
- Authentication: Required

#### Webhook Endpoints

**POST /api/v1/webhooks/endpoints**
- Body: `{ url, description?, events[] }`
- Returns: Webhook endpoint with generated secretKey
- Authentication: Required
- Validates: URL format, tests endpoint reachability

**GET /api/v1/webhooks/endpoints**
- Returns: List of webhook endpoints
- Authentication: Required

**PATCH /api/v1/webhooks/endpoints/:id**
- Body: `{ url?, events?, isActive? }`
- Returns: Updated webhook endpoint
- Authentication: Required

**DELETE /api/v1/webhooks/endpoints/:id**
- Returns: Success confirmation
- Authentication: Required

**POST /api/v1/webhooks/endpoints/:id/regenerate-secret**
- Returns: New secretKey
- Authentication: Required

**GET /api/v1/webhooks/deliveries**
- Query Parameters: `endpointId?`, `page`, `limit`, `status`
- Returns: Paginated webhook delivery logs
- Authentication: Required

**POST /api/v1/webhooks/deliveries/:id/retry**
- Returns: Retry confirmation
- Authentication: Required

#### Export Endpoints

**POST /api/v1/exports**
- Body: `{ type, format, filters }`
- Returns: Export job record
- Authentication: Required
- Creates AsyncTask for processing

**GET /api/v1/exports**
- Query Parameters: `page`, `limit`
- Returns: Paginated export history
- Authentication: Required

**GET /api/v1/exports/:id**
- Returns: Export job status and download URL
- Authentication: Required

**GET /api/v1/exports/:id/download**
- Returns: File download
- Authentication: Required
- Validates: file exists, not expired

## Data Models

### TypeScript Interfaces

```typescript
// Payment Link Types
interface PaymentLinkConfig {
  amount: number;
  currency: string;
  description?: string;
  expiresAt?: Date;
  usageLimit?: number;
  metadata?: Record<string, any>;
}

interface PaymentLink {
  id: string;
  linkId: string;
  tenantId: string;
  userId: string;
  amount: number;
  currency: string;
  description?: string;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentLinkMetrics {
  totalLinks: number;
  activeLinks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
}

// Analytics Types
interface RevenueDataPoint {
  date: string;
  amount: number;
  transactionCount: number;
}

interface PaymentMethodDistribution {
  method: string;
  count: number;
  percentage: number;
  totalAmount: number;
}

interface GeographicDistribution {
  country: string;
  countryCode: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
}

interface SuccessRateDataPoint {
  date: string;
  successRate: number;
  successfulCount: number;
  failedCount: number;
  totalCount: number;
}

// Settlement Types
interface AvailableBalance {
  amount: number;
  currency: string;
  pendingSettlements: number;
  nextSettlementDate: Date;
  settlementPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

interface SettlementRequest {
  amount: number;
  currency: string;
  bankAccount: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

interface Settlement {
  id: string;
  tenantId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  settlementPeriod: string;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  bankAccount: Record<string, any>;
  transactionIds: string[];
}

// Webhook Types
interface WebhookEndpointConfig {
  url: string;
  description?: string;
  events: WebhookEventType[];
}

type WebhookEventType = 
  | 'payment.success'
  | 'payment.failed'
  | 'payment.pending'
  | 'refund.completed'
  | 'settlement.completed';

interface WebhookEndpoint {
  id: string;
  tenantId: string;
  userId: string;
  url: string;
  description?: string;
  secretKey: string;
  events: WebhookEventType[];
  isActive: boolean;
  lastTestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: WebhookEventType;
  payload: Record<string, any>;
  signature: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  httpStatus?: number;
  responseTime?: number;
  attemptNumber: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  deliveredAt?: Date;
}

// Export Types
interface ExportRequest {
  type: 'TRANSACTIONS' | 'ANALYTICS' | 'SETTLEMENTS';
  format: 'CSV' | 'EXCEL';
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    currency?: string;
  };
}

interface ExportJob {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  format: string;
  filters: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  recordCount?: number;
  fileUrl?: string;
  fileSize?: number;
  expiresAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}
```


## Service Layer Architecture

### TransactionService

Handles all transaction-related operations with tenant scoping.

```typescript
class TransactionService {
  constructor(private prisma: PrismaClient) {}

  async getTransactions(params: {
    tenantId: string;
    page: number;
    limit: number;
    filters?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      currency?: string;
      type?: string;
    };
  }): Promise<PaginatedResult<Transaction>> {
    const { tenantId, page, limit, filters } = params;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.currency && { currency: filters.currency }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.dateFrom || filters?.dateTo) && {
        createdAt: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      },
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionStats(params: {
    tenantId: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<TransactionStats> {
    const { tenantId, dateFrom, dateTo } = params;

    const where = {
      tenantId,
      ...(dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      },
    };

    const [totalCount, successfulCount, revenueAgg] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.count({
        where: { ...where, status: 'completed' },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCount,
      successfulCount,
      totalRevenue: revenueAgg._sum.amount || 0,
      successRate: totalCount > 0 ? (successfulCount / totalCount) * 100 : 0,
    };
  }
}
```

### PaymentLinkService

Manages payment link creation, validation, and tracking.

```typescript
class PaymentLinkService {
  constructor(private prisma: PrismaClient) {}

  async createPaymentLink(params: {
    tenantId: string;
    userId: string;
    config: PaymentLinkConfig;
  }): Promise<PaymentLink> {
    const { tenantId, userId, config } = params;

    // Generate cryptographically secure link ID
    const linkId = this.generateSecureLinkId();

    const paymentLink = await this.prisma.paymentLink.create({
      data: {
        linkId,
        tenantId,
        userId,
        amount: config.amount,
        currency: config.currency,
        description: config.description,
        expiresAt: config.expiresAt,
        usageLimit: config.usageLimit,
        metadata: config.metadata,
        status: 'ACTIVE',
      },
    });

    return paymentLink;
  }

  private generateSecureLinkId(): string {
    // Generate 32 bytes of random data and encode as base64url
    const bytes = crypto.randomBytes(32);
    return bytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async validatePaymentLink(linkId: string): Promise<{
    valid: boolean;
    link?: PaymentLink;
    reason?: string;
  }> {
    const link = await this.prisma.paymentLink.findUnique({
      where: { linkId },
    });

    if (!link) {
      return { valid: false, reason: 'Link not found' };
    }

    if (link.status !== 'ACTIVE') {
      return { valid: false, reason: 'Link is inactive', link };
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      // Auto-expire the link
      await this.prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: 'EXPIRED' },
      });
      return { valid: false, reason: 'Link has expired', link };
    }

    if (link.usageLimit && link.usageCount >= link.usageLimit) {
      // Auto-deactivate the link
      await this.prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: 'INACTIVE' },
      });
      return { valid: false, reason: 'Usage limit reached', link };
    }

    return { valid: true, link };
  }

  async incrementUsage(linkId: string): Promise<void> {
    await this.prisma.paymentLink.update({
      where: { linkId },
      data: { usageCount: { increment: 1 } },
    });
  }

  async getPaymentLinkMetrics(params: {
    tenantId: string;
    linkId?: string;
  }): Promise<PaymentLinkMetrics> {
    const { tenantId, linkId } = params;

    const where = {
      tenantId,
      ...(linkId && { linkId }),
    };

    const [links, transactions] = await Promise.all([
      this.prisma.paymentLink.findMany({ where }),
      this.prisma.transaction.findMany({
        where: {
          tenantId,
          paymentLinkId: { not: null },
          ...(linkId && { paymentLink: { linkId } }),
        },
      }),
    ]);

    const activeLinks = links.filter(l => l.status === 'ACTIVE').length;
    const completedTransactions = transactions.filter(
      t => t.status === 'completed'
    );

    return {
      totalLinks: links.length,
      activeLinks,
      totalConversions: completedTransactions.length,
      conversionRate: links.length > 0 
        ? (completedTransactions.length / links.length) * 100 
        : 0,
      totalRevenue: completedTransactions.reduce(
        (sum, t) => sum + t.amount, 
        0
      ),
    };
  }
}
```

### AnalyticsService

Provides aggregated analytics with caching for performance.

```typescript
class AnalyticsService {
  constructor(
    private prisma: PrismaClient,
    private cacheService: CacheService
  ) {}

  async getRevenueOverTime(params: {
    tenantId: string;
    dateFrom: Date;
    dateTo: Date;
    granularity: 'daily' | 'weekly' | 'monthly';
  }): Promise<RevenueDataPoint[]> {
    const cacheKey = `revenue:${params.tenantId}:${params.dateFrom.toISOString()}:${params.dateTo.toISOString()}:${params.granularity}`;
    
    // Check cache first
    const cached = await this.cacheService.get<RevenueDataPoint[]>(cacheKey);
    if (cached) return cached;

    // Query database with date truncation based on granularity
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId: params.tenantId,
        status: 'completed',
        createdAt: {
          gte: params.dateFrom,
          lte: params.dateTo,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Aggregate by date
    const aggregated = this.aggregateByDate(
      transactions,
      params.granularity
    );

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, aggregated, 300);

    return aggregated;
  }

  private aggregateByDate(
    transactions: Array<{ amount: number; createdAt: Date }>,
    granularity: 'daily' | 'weekly' | 'monthly'
  ): RevenueDataPoint[] {
    const grouped = new Map<string, { amount: number; count: number }>();

    transactions.forEach(tx => {
      const key = this.getDateKey(tx.createdAt, granularity);
      const existing = grouped.get(key) || { amount: 0, count: 0 };
      grouped.set(key, {
        amount: existing.amount + tx.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        transactionCount: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getDateKey(date: Date, granularity: string): string {
    const d = new Date(date);
    switch (granularity) {
      case 'daily':
        return d.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }

  async getPaymentMethodDistribution(params: {
    tenantId: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<PaymentMethodDistribution[]> {
    const cacheKey = `payment-methods:${params.tenantId}:${params.dateFrom?.toISOString()}:${params.dateTo?.toISOString()}`;
    
    const cached = await this.cacheService.get<PaymentMethodDistribution[]>(cacheKey);
    if (cached) return cached;

    const transactions = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        tenantId: params.tenantId,
        status: 'completed',
        ...(params.dateFrom || params.dateTo) && {
          createdAt: {
            ...(params.dateFrom && { gte: params.dateFrom }),
            ...(params.dateTo && { lte: params.dateTo }),
          },
        },
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    const total = transactions.reduce((sum, t) => sum + t._count.id, 0);

    const distribution = transactions.map(t => ({
      method: t.type,
      count: t._count.id,
      percentage: (t._count.id / total) * 100,
      totalAmount: t._sum.amount || 0,
    }));

    await this.cacheService.set(cacheKey, distribution, 300);

    return distribution;
  }

  async getGeographicDistribution(params: {
    tenantId: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<GeographicDistribution[]> {
    // Join transactions with users to get country information
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId: params.tenantId,
        status: 'completed',
        ...(params.dateFrom || params.dateTo) && {
          createdAt: {
            ...(params.dateFrom && { gte: params.dateFrom }),
            ...(params.dateTo && { lte: params.dateTo }),
          },
        },
      },
      include: {
        user: {
          select: { country: true },
        },
      },
    });

    // Group by country
    const grouped = new Map<string, { count: number; amount: number }>();
    transactions.forEach(tx => {
      const country = tx.user.country;
      const existing = grouped.get(country) || { count: 0, amount: 0 };
      grouped.set(country, {
        count: existing.count + 1,
        amount: existing.amount + tx.amount,
      });
    });

    const total = transactions.length;

    return Array.from(grouped.entries()).map(([country, data]) => ({
      country,
      countryCode: country,
      transactionCount: data.count,
      totalAmount: data.amount,
      percentage: (data.count / total) * 100,
    }));
  }

  async getSuccessRateTrend(params: {
    tenantId: string;
    dateFrom: Date;
    dateTo: Date;
    granularity: 'daily' | 'weekly' | 'monthly';
  }): Promise<SuccessRateDataPoint[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId: params.tenantId,
        createdAt: {
          gte: params.dateFrom,
          lte: params.dateTo,
        },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    // Group by date and calculate success rate
    const grouped = new Map<string, {
      successful: number;
      failed: number;
      total: number;
    }>();

    transactions.forEach(tx => {
      const key = this.getDateKey(tx.createdAt, params.granularity);
      const existing = grouped.get(key) || { successful: 0, failed: 0, total: 0 };
      
      grouped.set(key, {
        successful: existing.successful + (tx.status === 'completed' ? 1 : 0),
        failed: existing.failed + (tx.status === 'failed' ? 1 : 0),
        total: existing.total + 1,
      });
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
        successfulCount: data.successful,
        failedCount: data.failed,
        totalCount: data.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
```

### SettlementService

Manages merchant payouts and balance calculations.

```typescript
class SettlementService {
  constructor(private prisma: PrismaClient) {}

  async getAvailableBalance(params: {
    tenantId: string;
    userId: string;
  }): Promise<AvailableBalance> {
    const { tenantId, userId } = params;

    // Calculate completed transaction total
    const completedTransactions = await this.prisma.transaction.aggregate({
      where: {
        tenantId,
        userId,
        status: 'completed',
      },
      _sum: { amount: true },
    });

    // Calculate pending settlements
    const pendingSettlements = await this.prisma.settlement.aggregate({
      where: {
        tenantId,
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      _sum: { amount: true },
    });

    const totalRevenue = completedTransactions._sum.amount || 0;
    const pendingAmount = pendingSettlements._sum.amount || 0;
    const availableAmount = totalRevenue - pendingAmount;

    // Get settlement configuration (default to weekly)
    const settlementPeriod = 'WEEKLY';
    const nextSettlementDate = this.calculateNextSettlementDate(settlementPeriod);

    return {
      amount: availableAmount,
      currency: 'USD', // TODO: Support multi-currency
      pendingSettlements: pendingAmount,
      nextSettlementDate,
      settlementPeriod,
    };
  }

  private calculateNextSettlementDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'DAILY':
        return new Date(now.setDate(now.getDate() + 1));
      case 'WEEKLY':
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        return new Date(now.setDate(now.getDate() + daysUntilMonday));
      case 'MONTHLY':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      default:
        return new Date(now.setDate(now.getDate() + 7));
    }
  }

  async requestSettlement(params: {
    tenantId: string;
    userId: string;
    request: SettlementRequest;
  }): Promise<Settlement> {
    const { tenantId, userId, request } = params;

    // Validate available balance
    const balance = await this.getAvailableBalance({ tenantId, userId });
    if (request.amount > balance.amount) {
      throw new Error('Insufficient balance for settlement');
    }

    // Check for duplicate settlement in current period
    const existingSettlement = await this.prisma.settlement.findFirst({
      where: {
        tenantId,
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (existingSettlement) {
      throw new Error('A settlement is already pending for this period');
    }

    // Get transaction IDs to include in settlement
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        userId,
        status: 'completed',
        // Exclude already settled transactions
        // This would require adding a 'settled' flag to Transaction model
      },
      select: { id: true },
    });

    const settlement = await this.prisma.settlement.create({
      data: {
        tenantId,
        userId,
        amount: request.amount,
        currency: request.currency,
        status: 'PENDING',
        settlementPeriod: balance.settlementPeriod,
        bankAccount: request.bankAccount,
        transactionIds: transactions.map(t => t.id),
      },
    });

    return settlement;
  }

  async processSettlement(settlementId: string): Promise<void> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    try {
      // Update settlement status
      await this.prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });

      // TODO: Integrate with payment provider for actual bank transfer
      // This would call external API to initiate bank transfer

      // Update wallet balance
      await this.prisma.wallet.updateMany({
        where: {
          tenantId: settlement.tenantId,
          userId: settlement.userId,
          currency: settlement.currency,
        },
        data: {
          balance: {
            decrement: settlement.amount,
          },
        },
      });

      // Mark settlement as completed
      await this.prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Trigger webhook
      await this.triggerWebhook({
        tenantId: settlement.tenantId,
        eventType: 'settlement.completed',
        payload: settlement,
      });
    } catch (error) {
      // Mark settlement as failed
      await this.prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'FAILED',
          failureReason: error.message,
        },
      });
      throw error;
    }
  }

  private async triggerWebhook(params: {
    tenantId: string;
    eventType: string;
    payload: any;
  }): Promise<void> {
    // This would be handled by WebhookService
    // Placeholder for webhook triggering logic
  }
}
```

### WebhookService

Handles webhook endpoint management and delivery with retry logic.

```typescript
class WebhookService {
  constructor(
    private prisma: PrismaClient,
    private httpClient: HttpClient
  ) {}

  async createEndpoint(params: {
    tenantId: string;
    userId: string;
    config: WebhookEndpointConfig;
  }): Promise<WebhookEndpoint> {
    const { tenantId, userId, config } = params;

    // Validate URL format
    try {
      new URL(config.url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Test endpoint reachability
    const isReachable = await this.testEndpoint(config.url);
    if (!isReachable) {
      throw new Error('Endpoint is not reachable');
    }

    // Generate secret key for HMAC signatures
    const secretKey = this.generateSecretKey();

    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        tenantId,
        userId,
        url: config.url,
        description: config.description,
        secretKey,
        events: config.events,
        isActive: true,
        lastTestedAt: new Date(),
      },
    });

    return endpoint;
  }

  private generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async testEndpoint(url: string): Promise<boolean> {
    try {
      const response = await this.httpClient.post(url, {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
      }, {
        timeout: 5000,
      });
      return response.status >= 200 && response.status < 300;
    } catch {
      return false;
    }
  }

  async deliverWebhook(params: {
    endpointId: string;
    eventType: WebhookEventType;
    payload: Record<string, any>;
  }): Promise<WebhookDelivery> {
    const { endpointId, eventType, payload } = params;

    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint || !endpoint.isActive) {
      throw new Error('Webhook endpoint not found or inactive');
    }

    // Check if endpoint is subscribed to this event
    if (!endpoint.events.includes(eventType)) {
      throw new Error('Endpoint not subscribed to this event type');
    }

    // Generate HMAC signature
    const signature = this.generateSignature(payload, endpoint.secretKey);

    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        endpointId,
        eventType,
        payload,
        signature,
        status: 'PENDING',
        attemptNumber: 1,
        maxAttempts: 3,
      },
    });

    // Attempt delivery
    await this.attemptDelivery(delivery.id);

    return delivery;
  }

  private generateSignature(payload: Record<string, any>, secretKey: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secretKey)
      .update(payloadString)
      .digest('hex');
  }

  private async attemptDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });

    if (!delivery) return;

    const startTime = Date.now();

    try {
      const response = await this.httpClient.post(
        delivery.endpoint.url,
        delivery.payload,
        {
          headers: {
            'X-Webhook-Signature': delivery.signature,
            'X-Webhook-Event': delivery.eventType,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const responseTime = Date.now() - startTime;

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'SUCCESS',
          httpStatus: response.status,
          responseTime,
          deliveredAt: new Date(),
        },
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Check if should retry
      const shouldRetry = delivery.attemptNumber < delivery.maxAttempts;
      const nextRetryAt = shouldRetry
        ? this.calculateNextRetry(delivery.attemptNumber)
        : null;

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: shouldRetry ? 'PENDING' : 'FAILED',
          httpStatus: error.response?.status,
          responseTime,
          errorMessage: error.message,
          attemptNumber: { increment: 1 },
          nextRetryAt,
        },
      });

      // Schedule retry if applicable
      if (shouldRetry) {
        setTimeout(() => this.attemptDelivery(deliveryId), 
          nextRetryAt.getTime() - Date.now());
      }
    }
  }

  private calculateNextRetry(attemptNumber: number): Date {
    // Exponential backoff: 1min, 5min, 15min
    const delays = [60000, 300000, 900000];
    const delay = delays[attemptNumber - 1] || delays[delays.length - 1];
    return new Date(Date.now() + delay);
  }

  async regenerateSecretKey(endpointId: string): Promise<string> {
    const newSecretKey = this.generateSecretKey();

    await this.prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { secretKey: newSecretKey },
    });

    return newSecretKey;
  }
}
```


### ExportService

Generates downloadable reports with async processing for large datasets.

```typescript
class ExportService {
  constructor(
    private prisma: PrismaClient,
    private storageService: StorageService
  ) {}

  async createExportJob(params: {
    tenantId: string;
    userId: string;
    request: ExportRequest;
  }): Promise<ExportJob> {
    const { tenantId, userId, request } = params;

    // Create export job
    const job = await this.prisma.exportJob.create({
      data: {
        tenantId,
        userId,
        type: request.type,
        format: request.format,
        filters: request.filters,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Create async task for processing
    await this.prisma.asyncTask.create({
      data: {
        type: 'EXPORT_GENERATION',
        payload: JSON.stringify({ exportJobId: job.id }),
        status: 'PENDING',
      },
    });

    return job;
  }

  async processExportJob(jobId: string): Promise<void> {
    const job = await this.prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Export job not found');
    }

    try {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      // Fetch data based on job type
      const data = await this.fetchExportData(job);

      // Generate file based on format
      const file = job.format === 'CSV'
        ? await this.generateCSV(data, job)
        : await this.generateExcel(data, job);

      // Upload to storage
      const fileUrl = await this.storageService.upload(file, {
        filename: `export-${job.id}.${job.format.toLowerCase()}`,
        contentType: job.format === 'CSV' 
          ? 'text/csv' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Update job with completion details
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          fileUrl,
          fileSize: file.length,
          recordCount: data.length,
          completedAt: new Date(),
        },
      });

      // TODO: Send email notification to user
    } catch (error) {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  private async fetchExportData(job: ExportJob): Promise<any[]> {
    const filters = job.filters as any;

    switch (job.type) {
      case 'TRANSACTIONS':
        return this.prisma.transaction.findMany({
          where: {
            tenantId: job.tenantId,
            ...(filters.status && { status: filters.status }),
            ...(filters.currency && { currency: filters.currency }),
            ...(filters.dateFrom || filters.dateTo) && {
              createdAt: {
                ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
                ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
              },
            },
          },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        });

      case 'SETTLEMENTS':
        return this.prisma.settlement.findMany({
          where: {
            tenantId: job.tenantId,
            ...(filters.status && { status: filters.status }),
            ...(filters.dateFrom || filters.dateTo) && {
              requestedAt: {
                ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
                ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
              },
            },
          },
          orderBy: { requestedAt: 'desc' },
        });

      case 'ANALYTICS':
        // Fetch aggregated analytics data
        const analyticsService = new AnalyticsService(this.prisma, null);
        return Promise.all([
          analyticsService.getRevenueOverTime({
            tenantId: job.tenantId,
            dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            dateTo: filters.dateTo ? new Date(filters.dateTo) : new Date(),
            granularity: 'daily',
          }),
          analyticsService.getPaymentMethodDistribution({
            tenantId: job.tenantId,
            dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
            dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
          }),
        ]);

      default:
        throw new Error(`Unsupported export type: ${job.type}`);
    }
  }

  private async generateCSV(data: any[], job: ExportJob): Promise<Buffer> {
    if (data.length === 0) {
      return Buffer.from('No data available');
    }

    // Add metadata header
    const metadata = [
      `Export Type: ${job.type}`,
      `Generated: ${new Date().toISOString()}`,
      `Filters: ${JSON.stringify(job.filters)}`,
      `Record Count: ${data.length}`,
      '',
    ].join('\n');

    // Generate CSV rows
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row)
        .map(val => {
          // Escape commas and quotes in CSV
          const str = String(val ?? '');
          return str.includes(',') || str.includes('"') 
            ? `"${str.replace(/"/g, '""')}"` 
            : str;
        })
        .join(',')
    );

    const csv = [metadata, headers, ...rows].join('\n');
    return Buffer.from(csv, 'utf-8');
  }

  private async generateExcel(data: any[], job: ExportJob): Promise<Buffer> {
    // Use a library like 'exceljs' for Excel generation
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export Data');

    // Add metadata
    worksheet.addRow(['Export Type', job.type]);
    worksheet.addRow(['Generated', new Date().toISOString()]);
    worksheet.addRow(['Filters', JSON.stringify(job.filters)]);
    worksheet.addRow(['Record Count', data.length]);
    worksheet.addRow([]);

    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.lastRow;
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? String(cell.value).length : 0;
          maxLength = Math.max(maxLength, length);
        });
        column.width = Math.min(maxLength + 2, 50);
      });
    }

    return workbook.xlsx.writeBuffer();
  }

  async cleanupExpiredExports(): Promise<void> {
    const expiredJobs = await this.prisma.exportJob.findMany({
      where: {
        status: 'COMPLETED',
        expiresAt: { lte: new Date() },
      },
    });

    for (const job of expiredJobs) {
      if (job.fileUrl) {
        await this.storageService.delete(job.fileUrl);
      }
      await this.prisma.exportJob.delete({
        where: { id: job.id },
      });
    }
  }
}
```

### CacheService

Provides caching for analytics aggregations.

```typescript
class CacheService {
  constructor(private prisma: PrismaClient) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.prisma.analyticsCache.findFirst({
      where: {
        cacheKey: key,
        expiresAt: { gt: new Date() },
      },
    });

    if (!cached) return null;

    return cached.data as T;
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await this.prisma.analyticsCache.upsert({
      where: {
        tenantId_cacheKey: {
          tenantId: this.getTenantIdFromKey(key),
          cacheKey: key,
        },
      },
      create: {
        tenantId: this.getTenantIdFromKey(key),
        cacheKey: key,
        metricType: this.getMetricTypeFromKey(key),
        data: data as any,
        expiresAt,
      },
      update: {
        data: data as any,
        expiresAt,
      },
    });
  }

  private getTenantIdFromKey(key: string): string {
    // Extract tenantId from cache key format: "metric:tenantId:..."
    return key.split(':')[1];
  }

  private getMetricTypeFromKey(key: string): string {
    // Extract metric type from cache key format: "metric:tenantId:..."
    return key.split(':')[0].toUpperCase();
  }

  async invalidate(pattern: string): Promise<void> {
    // Delete cache entries matching pattern
    await this.prisma.analyticsCache.deleteMany({
      where: {
        cacheKey: { contains: pattern },
      },
    });
  }
}
```

## React Component Structure

### Dashboard Overview Component

```typescript
// src/components/dashboard/MerchantDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { TransactionList } from './TransactionList';
import { AnalyticsCharts } from './AnalyticsCharts';
import { PaymentLinkManager } from './PaymentLinkManager';
import { SettlementPanel } from './SettlementPanel';
import { WebhookManager } from './WebhookManager';
import { ExportPanel } from './ExportPanel';

export function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="merchant-dashboard">
      <nav className="dashboard-tabs">
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('transactions')}>Transactions</button>
        <button onClick={() => setActiveTab('payment-links')}>Payment Links</button>
        <button onClick={() => setActiveTab('analytics')}>Analytics</button>
        <button onClick={() => setActiveTab('settlements')}>Settlements</button>
        <button onClick={() => setActiveTab('webhooks')}>Webhooks</button>
        <button onClick={() => setActiveTab('exports')}>Exports</button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'overview' && <DashboardOverview />}
        {activeTab === 'transactions' && <TransactionList />}
        {activeTab === 'payment-links' && <PaymentLinkManager />}
        {activeTab === 'analytics' && <AnalyticsCharts />}
        {activeTab === 'settlements' && <SettlementPanel />}
        {activeTab === 'webhooks' && <WebhookManager />}
        {activeTab === 'exports' && <ExportPanel />}
      </div>
    </div>
  );
}
```

### Transaction List Component

```typescript
// src/components/dashboard/TransactionList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  reference: string;
  createdAt: string;
  user: {
    email: string;
    phoneNumber: string;
  };
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    currency: '',
    page: 1,
    limit: 25,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });

      const response = await fetch(`/api/v1/transactions?${params}`);
      const data = await response.json();

      setTransactions(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-list">
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
          placeholder="From Date"
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
          placeholder="To Date"
        />

        <select
          value={filters.currency}
          onChange={(e) => setFilters({ ...filters, currency: e.target.value, page: 1 })}
        >
          <option value="">All Currencies</option>
          <option value="USD">USD</option>
          <option value="KES">KES</option>
          <option value="ZWL">ZWL</option>
        </select>

        <select
          value={filters.limit}
          onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })}
        >
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : (
        <>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.reference}</td>
                  <td>{tx.amount} {tx.currency}</td>
                  <td>
                    <span className={`status-badge status-${tx.status}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td>{tx.type}</td>
                  <td>
                    {tx.user.email}<br />
                    <small>{tx.user.phoneNumber}</small>
                  </td>
                  <td>{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              Previous
            </button>
            <span>
              Page {filters.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <button
              disabled={filters.page === pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### Analytics Charts Component

```typescript
// src/components/dashboard/AnalyticsCharts.tsx
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

export function AnalyticsCharts() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [revenueData, setRevenueData] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [geography, setGeography] = useState([]);
  const [successRate, setSuccessRate] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, granularity]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        granularity,
      });

      const [revenue, methods, geo, success] = await Promise.all([
        fetch(`/api/v1/analytics/revenue?${params}`).then(r => r.json()),
        fetch(`/api/v1/analytics/payment-methods?${params}`).then(r => r.json()),
        fetch(`/api/v1/analytics/geography?${params}`).then(r => r.json()),
        fetch(`/api/v1/analytics/success-rate?${params}`).then(r => r.json()),
      ]);

      setRevenueData(revenue.data);
      setPaymentMethods(methods.data);
      setGeography(geo.data);
      setSuccessRate(success.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="analytics-charts">
      <div className="controls">
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
        />
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
        />
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as any)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : (
        <div className="charts-grid">
          <div className="chart-container">
            <h3>Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Payment Method Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="percentage"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Geographic Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geography}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="transactionCount" fill="#82ca9d" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Success Rate Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={successRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="successRate" stroke="#00C49F" name="Success Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Payment Link Manager Component

```typescript
// src/components/dashboard/PaymentLinkManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

export function PaymentLinkManager() {
  const [links, setLinks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    description: '',
    expiresAt: '',
    usageLimit: '',
  });
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    loadPaymentLinks();
  }, []);

  const loadPaymentLinks = async () => {
    try {
      const response = await fetch('/api/v1/payment-links');
      const data = await response.json();
      setLinks(data.data);
    } catch (error) {
      console.error('Failed to load payment links:', error);
    }
  };

  const createPaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          description: formData.description || undefined,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        }),
      });

      if (response.ok) {
        const newLink = await response.json();
        setLinks([newLink.data, ...links]);
        setShowCreateForm(false);
        setFormData({
          amount: '',
          currency: 'USD',
          description: '',
          expiresAt: '',
          usageLimit: '',
        });
      }
    } catch (error) {
      console.error('Failed to create payment link:', error);
    }
  };

  const copyToClipboard = (linkId: string) => {
    const url = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(url);
    alert('Payment link copied to clipboard!');
  };

  return (
    <div className="payment-link-manager">
      <div className="header">
        <h2>Payment Links</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create New Link'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={createPaymentLink} className="create-form">
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="USD">USD</option>
            <option value="KES">KES</option>
            <option value="ZWL">ZWL</option>
          </select>
          <input
            type="text"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="datetime-local"
            placeholder="Expires At (optional)"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
          <input
            type="number"
            placeholder="Usage Limit (optional)"
            value={formData.usageLimit}
            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
          />
          <button type="submit">Create Payment Link</button>
        </form>
      )}

      <div className="links-list">
        {links.map((link: any) => (
          <div key={link.id} className="link-card">
            <div className="link-info">
              <h4>{link.description || 'Payment Link'}</h4>
              <p className="amount">{link.amount} {link.currency}</p>
              <p className="usage">
                Used: {link.usageCount} 
                {link.usageLimit && ` / ${link.usageLimit}`}
              </p>
              <p className="status">
                Status: <span className={`status-${link.status.toLowerCase()}`}>
                  {link.status}
                </span>
              </p>
              {link.expiresAt && (
                <p className="expiry">
                  Expires: {new Date(link.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="link-actions">
              <button onClick={() => copyToClipboard(link.linkId)}>
                Copy Link
              </button>
              <a href={`/pay/${link.linkId}`} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, the following properties have been identified for property-based testing:

### Property 1: Transaction Display Completeness

*For any* transaction record, the rendered dashboard output SHALL contain all required fields: amount, currency, status, type, reference, and createdAt.

**Validates: Requirements 1.2**

### Property 2: Filter Query Construction

*For any* valid combination of filters (status, date range, currency), the generated Prisma query SHALL include all specified filter conditions.

**Validates: Requirements 1.3**

### Property 3: Pagination Correctness

*For any* valid page size (10, 25, 50, 100) and page number, the returned transaction set SHALL contain exactly page_size records (or fewer on the last page) and SHALL be the correct subset based on the page number.

**Validates: Requirements 1.4**

### Property 4: User Relation Inclusion

*For any* transaction query, the Prisma query SHALL include the user relation in the include clause.

**Validates: Requirements 1.5**

### Property 5: Aggregate Calculation Accuracy

*For any* set of transactions, the calculated aggregates (total count, successful count, total revenue) SHALL match the expected values computed from the transaction set.

**Validates: Requirements 1.6**

### Property 6: Default Ordering

*For any* transaction query without explicit ordering, the results SHALL be ordered by createdAt in descending order.

**Validates: Requirements 1.7**

### Property 7: Payment Link ID Uniqueness

*For any* number of payment links created sequentially, all generated linkIds SHALL be unique.

**Validates: Requirements 2.1**

### Property 8: Payment Link Round-Trip

*For any* valid payment link configuration, creating the link and then retrieving it SHALL return a record with all fields matching the original configuration.

**Validates: Requirements 2.2**

### Property 9: Payment Link URL Format

*For any* created payment link, the returned URL SHALL match the format `/pay/{linkId}` where linkId is the generated identifier.

**Validates: Requirements 2.3**

### Property 10: Usage Count Increment

*For any* payment link, when the link is used for a payment, the usageCount SHALL increment by exactly 1.

**Validates: Requirements 2.4**

### Property 11: Usage Limit Enforcement

*For any* payment link with a usage limit, when usageCount reaches the limit, the status SHALL automatically change to INACTIVE.

**Validates: Requirements 2.5**

### Property 12: Expiry Validation

*For any* payment link with an expiry date, validation SHALL fail when the current time is after the expiry date.

**Validates: Requirements 2.6**

### Property 13: Payment Link Validation Logic

*For any* payment link, the validation function SHALL correctly identify whether the link is active (status=ACTIVE, not expired, usage limit not reached) or inactive.

**Validates: Requirements 2.8**

### Property 14: Revenue Aggregation Accuracy

*For any* set of transactions and time granularity (daily, weekly, monthly), the aggregated revenue amounts SHALL equal the sum of transaction amounts grouped by the specified time period.

**Validates: Requirements 3.1**

### Property 15: Payment Method Percentage Calculation

*For any* set of transactions, the calculated payment method percentages SHALL sum to 100% and each percentage SHALL equal (count for method / total count) * 100.

**Validates: Requirements 3.2**

### Property 16: Geographic Grouping Accuracy

*For any* set of transactions, the geographic distribution SHALL correctly group transactions by country with accurate counts per country.

**Validates: Requirements 3.3**

### Property 17: Success Rate Calculation

*For any* set of transactions and time period, the success rate SHALL equal (successful transactions / total transactions) * 100.

**Validates: Requirements 3.4**

### Property 18: Date Range Filtering

*For any* date range filter, the analytics results SHALL include only transactions with createdAt within the specified range.

**Validates: Requirements 3.5**

### Property 19: Available Balance Calculation

*For any* set of completed transactions and pending settlements, the available balance SHALL equal sum(completed transaction amounts) - sum(pending settlement amounts).

**Validates: Requirements 4.1**

### Property 20: Next Settlement Date Calculation

*For any* settlement period (daily, weekly, monthly) and current date, the calculated next settlement date SHALL be the correct next occurrence of that period.

**Validates: Requirements 4.2**

### Property 21: Payout Amount Validation

*For any* payout request amount and available balance, validation SHALL pass if and only if amount <= available balance.

**Validates: Requirements 4.3**

### Property 22: Payout Record Round-Trip

*For any* payout request, creating the payout and then retrieving it SHALL return a record with all fields matching the original request.

**Validates: Requirements 4.4**

### Property 23: Settlement Processing Consistency

*For any* settlement that is processed, the wallet balance SHALL decrease by the settlement amount AND all associated transactions SHALL be marked as settled.

**Validates: Requirements 4.6**

### Property 24: Duplicate Payout Prevention

*For any* settlement period, attempting to create a second payout request for the same period while a pending payout exists SHALL be rejected.

**Validates: Requirements 4.7**

### Property 25: Webhook Configuration Round-Trip

*For any* valid webhook configuration, creating the webhook and then retrieving it SHALL return a record with all fields matching the original configuration.

**Validates: Requirements 5.1**

### Property 26: URL Format Validation

*For any* URL string, the webhook URL validation SHALL correctly identify valid URLs (proper protocol, domain, path) and reject invalid ones.

**Validates: Requirements 5.3**

### Property 27: Webhook Update Persistence

*For any* webhook update (URL, events, isActive), applying the update and then retrieving the webhook SHALL return the updated values.

**Validates: Requirements 5.4**

### Property 28: Webhook Delivery Logging Completeness

*For any* webhook delivery attempt, the created log record SHALL contain all required fields: timestamp, eventType, httpStatus, responseTime.

**Validates: Requirements 5.6**

### Property 29: Exponential Backoff Retry Pattern

*For any* failed webhook delivery, the retry attempts SHALL follow an exponential backoff pattern with delays increasing between attempts (1min, 5min, 15min).

**Validates: Requirements 5.7**

### Property 30: HMAC Signature Generation

*For any* webhook payload and secret key, the generated HMAC-SHA256 signature SHALL be deterministic and verifiable using the same secret key.

**Validates: Requirements 5.8**

### Property 31: Secret Key Regeneration

*For any* webhook endpoint, regenerating the secret key SHALL produce a different key that is persisted in the database.

**Validates: Requirements 5.10**

### Property 32: CSV Export Completeness

*For any* set of transactions, the generated CSV export SHALL contain all transaction fields for each record.

**Validates: Requirements 6.1**

### Property 33: Excel Export Structure

*For any* set of transactions, the generated Excel export SHALL have formatted columns and summary statistics that match the transaction data.

**Validates: Requirements 6.2**

### Property 34: Export Filter Consistency

*For any* set of active filters, the exported data SHALL contain only records that match all applied filters.

**Validates: Requirements 6.3**

### Property 35: Analytics Report Completeness

*For any* data set, the generated analytics report SHALL include all required metrics: revenue summaries, payment method breakdowns, and success rates.

**Validates: Requirements 6.4**

### Property 36: Export Metadata Inclusion

*For any* export file, the file SHALL contain metadata including generation timestamp, filter criteria, and record count.

**Validates: Requirements 6.7**

### Property 37: Payment Link Parser Validation

*For any* valid payment link configuration, the parser SHALL successfully parse it into a PaymentLink record with all fields correctly mapped.

**Validates: Requirements 7.1**

### Property 38: Parser Error Handling

*For any* invalid payment link configuration (missing required fields, invalid types), the parser SHALL return a descriptive validation error.

**Validates: Requirements 7.2**

### Property 39: Payment Link Formatter Output

*For any* PaymentLink database record, the formatter SHALL produce a URL string in the format `/pay/{linkId}`.

**Validates: Requirements 7.3**

### Property 40: Payment Link Round-Trip Property

*For any* valid PaymentLink configuration, the sequence of operations (parse config → format to URL → parse URL parameters) SHALL produce an equivalent PaymentLink object.

**Validates: Requirements 7.4**

### Property 41: Required Field Validation

*For any* payment link configuration, the parser SHALL enforce that required fields (amount, currency) are present and SHALL accept optional fields (expiry, usageLimit) when provided.

**Validates: Requirements 7.5**

### Property 42: Parameter Encoding Security

*For any* payment link, tampering with the encoded URL parameters SHALL be detectable through signature verification.

**Validates: Requirements 7.6**



## Error Handling

### Error Categories

The system implements comprehensive error handling across all layers:

#### 1. Validation Errors (400 Bad Request)

- Invalid input data (missing required fields, wrong types)
- Invalid filter combinations
- Invalid date ranges
- Invalid payment link configurations
- Invalid webhook URLs

**Handling Strategy:**
- Validate input at API boundary using Zod schemas
- Return descriptive error messages with field-level details
- Log validation failures for monitoring

#### 2. Authentication/Authorization Errors (401/403)

- Missing or invalid authentication tokens
- Insufficient permissions for tenant resources
- Expired sessions

**Handling Strategy:**
- Middleware validates authentication on all protected routes
- Tenant scoping enforced at database query level
- Return clear error messages without exposing security details

#### 3. Resource Not Found Errors (404)

- Payment link not found
- Webhook endpoint not found
- Export job not found
- Settlement not found

**Handling Strategy:**
- Check resource existence before operations
- Return 404 with resource type and ID
- Log access attempts to non-existent resources

#### 4. Business Logic Errors (422 Unprocessable Entity)

- Insufficient balance for payout
- Payment link expired or usage limit reached
- Duplicate payout request for same period
- Webhook endpoint unreachable

**Handling Strategy:**
- Validate business rules before state changes
- Return specific error codes for each business rule violation
- Provide actionable error messages

#### 5. External Service Errors (502/503)

- Payment provider unavailable
- Email service failure
- Storage service failure
- Webhook delivery failure

**Handling Strategy:**
- Implement retry logic with exponential backoff
- Queue failed operations for later retry
- Return 503 with retry-after header
- Log external service failures for monitoring

#### 6. Database Errors (500)

- Connection failures
- Query timeouts
- Constraint violations
- Transaction deadlocks

**Handling Strategy:**
- Wrap database operations in try-catch blocks
- Retry transient failures (connection, timeout)
- Log all database errors with query context
- Return generic 500 error to client (don't expose DB details)

#### 7. Rate Limiting Errors (429)

- Too many requests from same tenant
- Too many export requests
- Too many webhook deliveries

**Handling Strategy:**
- Implement rate limiting middleware
- Return 429 with retry-after header
- Track rate limit violations per tenant

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Additional error context
    field?: string;         // Field name for validation errors
    timestamp: string;      // ISO 8601 timestamp
    requestId: string;      // Request ID for tracing
  };
}
```

### Error Logging

All errors are logged with structured data:

```typescript
{
  level: 'error',
  timestamp: '2024-01-15T10:30:00Z',
  requestId: 'req_abc123',
  tenantId: 'tenant_xyz',
  userId: 'user_123',
  errorCode: 'INSUFFICIENT_BALANCE',
  errorMessage: 'Insufficient balance for payout',
  stackTrace: '...',
  context: {
    requestedAmount: 1000,
    availableBalance: 500
  }
}
```

### Retry Strategies

#### Webhook Delivery Retries

- Max attempts: 3
- Backoff: Exponential (1min, 5min, 15min)
- Retry conditions: Network errors, 5xx responses
- No retry: 4xx responses (except 429)

#### Export Generation Retries

- Max attempts: 2
- Backoff: Linear (5min, 10min)
- Retry conditions: Transient database errors, storage failures
- No retry: Validation errors, data not found

#### External API Retries

- Max attempts: 3
- Backoff: Exponential with jitter
- Retry conditions: Timeouts, connection errors, 503
- No retry: 4xx responses

### Circuit Breaker Pattern

For external services (payment providers, email service):

- Open circuit after 5 consecutive failures
- Half-open after 60 seconds
- Close circuit after 2 successful requests
- Fail fast when circuit is open

## Testing Strategy

### Testing Approach

The merchant dashboard enhancements will be tested using a comprehensive multi-layered approach:

#### 1. Unit Tests

**Scope:** Individual functions, services, and utilities

**Tools:** Jest, TypeScript

**Coverage Targets:**
- Service layer: 90%
- Utility functions: 95%
- Validation logic: 100%

**Focus Areas:**
- Input validation functions
- Business logic calculations (balance, aggregations, percentages)
- Date/time calculations
- URL formatting and parsing
- Signature generation
- Error handling paths

**Example Unit Tests:**
```typescript
describe('PaymentLinkService', () => {
  it('should generate unique link IDs', () => {
    const service = new PaymentLinkService(prisma);
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(service.generateSecureLinkId());
    }
    expect(ids.size).toBe(1000);
  });

  it('should validate expired links', async () => {
    const expiredLink = {
      ...mockLink,
      expiresAt: new Date('2020-01-01')
    };
    const result = await service.validatePaymentLink(expiredLink.linkId);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Link has expired');
  });
});
```

#### 2. Property-Based Tests

**Scope:** Universal properties that should hold for all inputs

**Tools:** fast-check (JavaScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: merchant-dashboard-enhancements, Property {N}: {description}`

**Property Test Implementation:**

All 42 correctness properties defined in the Correctness Properties section will be implemented as property-based tests. Each property test will:

1. Generate random valid inputs using fast-check arbitraries
2. Execute the system under test
3. Assert the property holds for all generated inputs
4. Shrink failing inputs to minimal counterexamples

**Example Property Test:**
```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  it('Property 8: Payment Link Round-Trip', () => {
    // Feature: merchant-dashboard-enhancements, Property 8: Payment link round-trip
    fc.assert(
      fc.asyncProperty(
        fc.record({
          amount: fc.double({ min: 0.01, max: 1000000 }),
          currency: fc.constantFrom('USD', 'KES', 'ZWL'),
          description: fc.option(fc.string()),
          expiresAt: fc.option(fc.date()),
          usageLimit: fc.option(fc.integer({ min: 1, max: 1000 }))
        }),
        async (config) => {
          const created = await paymentLinkService.createPaymentLink({
            tenantId: 'test-tenant',
            userId: 'test-user',
            config
          });
          
          const retrieved = await paymentLinkService.getPaymentLink(created.id);
          
          expect(retrieved.amount).toBe(config.amount);
          expect(retrieved.currency).toBe(config.currency);
          expect(retrieved.description).toBe(config.description);
          // ... assert all fields match
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Available Balance Calculation', () => {
    // Feature: merchant-dashboard-enhancements, Property 19: Balance calculation
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          amount: fc.double({ min: 0.01, max: 10000 }),
          status: fc.constantFrom('completed', 'pending', 'failed')
        })),
        fc.array(fc.record({
          amount: fc.double({ min: 0.01, max: 5000 }),
          status: fc.constantFrom('PENDING', 'PROCESSING', 'COMPLETED')
        })),
        async (transactions, settlements) => {
          // Setup test data
          await setupTransactions(transactions);
          await setupSettlements(settlements);
          
          const balance = await settlementService.getAvailableBalance({
            tenantId: 'test-tenant',
            userId: 'test-user'
          });
          
          const expectedCompleted = transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
          
          const expectedPending = settlements
            .filter(s => ['PENDING', 'PROCESSING'].includes(s.status))
            .reduce((sum, s) => sum + s.amount, 0);
          
          expect(balance.amount).toBeCloseTo(expectedCompleted - expectedPending, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### 3. Integration Tests

**Scope:** API endpoints, database interactions, external service integrations

**Tools:** Jest, Supertest, Test database

**Focus Areas:**
- API endpoint request/response cycles
- Database query correctness with real Prisma client
- Authentication and authorization middleware
- Tenant isolation
- Transaction atomicity
- Cache behavior

**Example Integration Test:**
```typescript
describe('GET /api/v1/transactions', () => {
  it('should return paginated transactions for authenticated merchant', async () => {
    const response = await request(app)
      .get('/api/v1/transactions?page=1&limit=25')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 25,
      total: expect.any(Number),
      totalPages: expect.any(Number)
    });
  });

  it('should filter transactions by status', async () => {
    const response = await request(app)
      .get('/api/v1/transactions?status=completed')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(response.body.data.every(t => t.status === 'completed')).toBe(true);
  });

  it('should enforce tenant isolation', async () => {
    const response = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${otherMerchantToken}`)
      .expect(200);

    expect(response.body.data.every(t => t.tenantId === otherTenantId)).toBe(true);
  });
});
```

#### 4. End-to-End Tests

**Scope:** Complete user workflows through the UI

**Tools:** Playwright or Cypress

**Focus Areas:**
- Dashboard loading and data display
- Creating payment links
- Viewing analytics charts
- Requesting payouts
- Configuring webhooks
- Exporting reports

**Example E2E Test:**
```typescript
test('merchant can create and share payment link', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Payment Links');
  await page.click('text=Create New Link');
  
  await page.fill('input[placeholder="Amount"]', '100');
  await page.selectOption('select[name="currency"]', 'USD');
  await page.fill('input[placeholder="Description"]', 'Test Payment');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.link-card')).toContainText('Test Payment');
  await expect(page.locator('.link-card')).toContainText('100 USD');
  
  await page.click('text=Copy Link');
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toMatch(/\/pay\/[a-zA-Z0-9_-]+/);
});
```

#### 5. Performance Tests

**Scope:** API response times, database query performance, large dataset handling

**Tools:** k6, Artillery

**Focus Areas:**
- Transaction list pagination with large datasets
- Analytics aggregation performance
- Export generation for large datasets
- Concurrent webhook deliveries
- Cache effectiveness

**Performance Targets:**
- Transaction list API: < 200ms (p95)
- Analytics API: < 500ms (p95) with caching
- Payment link creation: < 100ms (p95)
- Export generation: < 30s for 10k records
- Webhook delivery: < 5s (p95)

#### 6. Security Tests

**Scope:** Authentication, authorization, input validation, injection attacks

**Tools:** OWASP ZAP, Custom security test suite

**Focus Areas:**
- Tenant isolation (cannot access other tenant's data)
- SQL injection prevention
- XSS prevention in dashboard
- CSRF protection
- Rate limiting
- Webhook signature verification
- Payment link tampering detection

### Test Data Management

**Test Database:**
- Separate test database instance
- Reset before each test suite
- Seed with realistic test data
- Use transactions for test isolation

**Test Fixtures:**
- Reusable test data factories
- Randomized data generation for property tests
- Consistent tenant/user setup across tests

**Mock Services:**
- Mock external payment providers
- Mock email service
- Mock storage service
- Mock webhook endpoints for testing delivery

### Continuous Integration

**CI Pipeline:**
1. Lint and type check
2. Run unit tests (parallel)
3. Run property-based tests (parallel)
4. Run integration tests (sequential)
5. Run E2E tests (parallel by feature)
6. Generate coverage report
7. Run security scans

**Coverage Requirements:**
- Overall: 85%
- Critical paths: 95%
- New code: 90%

**Test Execution Time Targets:**
- Unit tests: < 2 minutes
- Property tests: < 5 minutes
- Integration tests: < 5 minutes
- E2E tests: < 10 minutes
- Total CI pipeline: < 15 minutes

### Testing Best Practices

1. **Test Isolation:** Each test should be independent and not rely on other tests
2. **Descriptive Names:** Test names should clearly describe what is being tested
3. **Arrange-Act-Assert:** Follow AAA pattern for test structure
4. **Mock External Dependencies:** Don't make real API calls in tests
5. **Test Edge Cases:** Include boundary conditions, empty inputs, large inputs
6. **Property Test Shrinking:** Leverage fast-check's shrinking to find minimal failing cases
7. **Deterministic Tests:** Avoid flaky tests by controlling time, randomness, and async operations
8. **Test Documentation:** Document complex test scenarios and property test strategies

## Implementation Notes

### Database Migrations

The following Prisma migrations need to be created:

1. **Add PaymentLink table** with indexes on tenantId, linkId, status, expiresAt
2. **Add Settlement table** with indexes on tenantId, userId, status, requestedAt
3. **Add WebhookEndpoint table** with indexes on tenantId, isActive
4. **Add WebhookDelivery table** with indexes on endpointId, status, nextRetryAt
5. **Add ExportJob table** with indexes on tenantId, userId, status, expiresAt
6. **Add AnalyticsCache table** with unique constraint on (tenantId, cacheKey)
7. **Modify Transaction table** to add paymentLinkId foreign key

### Performance Optimizations

1. **Database Indexes:**
   - Composite index on (tenantId, createdAt) for transaction queries
   - Composite index on (tenantId, status) for filtering
   - Index on expiresAt for cleanup jobs

2. **Query Optimization:**
   - Use Prisma's select to fetch only needed fields
   - Implement cursor-based pagination for large datasets
   - Use database aggregations instead of application-level calculations

3. **Caching Strategy:**
   - Cache analytics aggregations for 5 minutes
   - Cache payment link validation results for 1 minute
   - Invalidate cache on data mutations

4. **Async Processing:**
   - Use AsyncTask model for export generation
   - Queue webhook deliveries for async processing
   - Batch process expired payment links cleanup

### Security Considerations

1. **Tenant Isolation:**
   - All queries must include tenantId filter
   - Middleware validates tenant membership
   - Audit log all cross-tenant access attempts

2. **Input Validation:**
   - Validate all API inputs with Zod schemas
   - Sanitize user-provided descriptions and metadata
   - Validate URL formats for webhooks

3. **Rate Limiting:**
   - 100 requests per minute per tenant for dashboard APIs
   - 10 payment link creations per minute per tenant
   - 5 export requests per hour per tenant

4. **Webhook Security:**
   - HMAC-SHA256 signatures for all webhook payloads
   - Rotate secret keys on demand
   - Log all webhook delivery attempts

5. **Data Privacy:**
   - Mask sensitive data in logs
   - Encrypt webhook secret keys at rest
   - Auto-delete expired export files

### Monitoring and Observability

1. **Metrics to Track:**
   - API response times (p50, p95, p99)
   - Database query times
   - Cache hit rates
   - Webhook delivery success rates
   - Export generation times
   - Error rates by endpoint

2. **Alerts:**
   - API error rate > 5%
   - Database query time > 1s
   - Webhook delivery failure rate > 10%
   - Export generation failures
   - Cache miss rate > 50%

3. **Logging:**
   - Structured JSON logs
   - Request ID for tracing
   - Tenant ID and user ID in all logs
   - Log levels: DEBUG, INFO, WARN, ERROR

### Deployment Strategy

1. **Database Migrations:**
   - Run migrations in staging first
   - Verify data integrity after migration
   - Rollback plan for each migration

2. **Feature Flags:**
   - Enable features gradually per tenant
   - A/B test new analytics visualizations
   - Rollback capability without deployment

3. **Rollout Plan:**
   - Phase 1: Real transaction data (Requirement 1)
   - Phase 2: Payment links (Requirement 2)
   - Phase 3: Analytics charts (Requirement 3)
   - Phase 4: Settlements (Requirement 4)
   - Phase 5: Webhooks (Requirement 5)
   - Phase 6: Exports (Requirement 6)

4. **Monitoring During Rollout:**
   - Watch error rates closely
   - Monitor database performance
   - Track user adoption metrics
   - Collect user feedback

## Conclusion

This design document provides a comprehensive technical specification for enhancing the WeduPay merchant dashboard with real database-backed functionality. The architecture follows established patterns in the codebase, maintains multi-tenant isolation, and prioritizes performance, security, and correctness through property-based testing.

The implementation will replace mock data with actual Prisma queries, add new features for payment links, analytics, settlements, webhooks, and exports, and ensure all functionality is thoroughly tested with both traditional unit/integration tests and property-based tests for universal correctness guarantees.
