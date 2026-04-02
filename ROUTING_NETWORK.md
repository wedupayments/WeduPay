# Money Routing Network - Documentation

## Overview

The **Money Routing Network** is an intelligent payment routing system that automatically selects the optimal payment provider for each transaction across 20+ African mobile money providers.

### Key Features

- 🧠 **Intelligent Provider Selection** - Scores providers based on success rate, cost, speed, and availability
- 🔄 **Automatic Fallback** - Retries failed transactions with alternative providers
- 💱 **Cross-Border FX Optimization** - Finds best exchange rates for multi-currency transactions
- 📊 **Real-Time Health Monitoring** - Continuously tracks provider status and performance
- ⚡ **Sub-second Routing Decisions** - Optimized scoring algorithm for fast routing
- 📈 **Analytics & Metrics** - Track routing performance and cost savings

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Payment Request                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Money Routing Engine                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Get Eligible Providers                               │   │
│  │     - Filter by country, currency, amount                │   │
│  │     - Check health status                                │   │
│  │     - Apply routing rules                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  2. Score Providers                                      │   │
│  │     - Success rate (25%)                                 │   │
│  │     - Cost/fees (25%)                                    │   │
│  │     - Response time (25%)                                │   │
│  │     - Availability (25%)                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  3. Select Best Provider                                 │   │
│  │     - Apply routing strategy                             │   │
│  │     - Consider preferences/exclusions                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  4. Execute with Fallback                                │   │
│  │     - Attempt payment                                    │   │
│  │     - Retry with alternatives on failure                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              African Mobile Money Providers                      │
│   M-Pesa │ EcoCash │ Flutterwave │ Paystack │ Orange │ Wave    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Seed the Routing Database

```bash
npx tsx prisma/seed-routing.ts
```

This populates:
- 17 payment providers with default configurations
- 9 routing rules for different regions/scenarios
- 16 exchange rates for cross-border routing

### 2. Start Health Monitoring (Optional)

```typescript
// In your app initialization
import { providerHealthMonitor } from '@/src/services/routing/provider-health-monitor';

// Start background health monitoring
providerHealthMonitor.start();
```

### 3. Make a Routed Payment

```typescript
import { MoneyRoutingEngine } from '@/src/services/routing/money-routing-engine';

const routingEngine = new MoneyRoutingEngine();

const result = await routingEngine.executePayment(
  {
    amount: 5000,
    currency: 'KES',
    destinationCountry: 'KE',
    userId: 'user-123',
  },
  {
    phoneNumber: '254712345678',
    reference: 'ORDER-123456',
    description: 'Payment for order',
    callbackUrl: 'https://yoursite.com/api/webhooks/payment',
  }
);

console.log(result);
// {
//   success: true,
//   provider: 'mpesa',
//   transactionId: 'TXN-...',
//   providerReference: 'LKJ123456',
//   status: 'SUCCESS',
//   attempts: 1,
// }
```

---

## Routing Strategies

### Available Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `best_rate` | Balanced scoring across all factors | Default for most transactions |
| `cheapest` | Prioritizes lowest fees | Cost-sensitive payments |
| `fastest` | Prioritizes fastest response time | Time-critical payments |
| `primary_first` | Uses primary provider first | When you have preferred partners |
| `success_rate_optimized` | Maximizes success probability | High-value transactions |
| `round_robin` | Distributes across providers | Load balancing |

### Example: Using Different Strategies

```typescript
// Cheapest route
const cheapestResult = await routingEngine.executePayment(
  context,
  paymentRequest,
  { strategy: RoutingStrategy.CHEAPEST }
);

// Fastest route for urgent payment
const fastestResult = await routingEngine.executePayment(
  context,
  paymentRequest,
  { strategy: RoutingStrategy.FASTEST }
);

// Success-optimized for high-value transaction
const safeResult = await routingEngine.executePayment(
  { ...context, amount: 100000 },
  paymentRequest,
  { strategy: RoutingStrategy.SUCCESS_RATE_OPTIMIZED }
);
```

---

## API Reference

### POST /api/v1/routing/payment

Route a payment through the optimal provider.

**Request:**
```json
{
  "amount": 5000,
  "currency": "KES",
  "country": "KE",
  "phoneNumber": "254712345678",
  "reference": "ORDER-123456",
  "description": "Payment for order",
  "routingStrategy": "best_rate",
  "maxRetries": 3,
  "preferredProviders": ["mpesa"],
  "excludedProviders": []
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "REQ-123456",
  "transactionId": "TXN-123456",
  "routedTransactionId": "RT-123456",
  "provider": "mpesa",
  "providerReference": "LKJ123456",
  "status": "SUCCESS",
  "message": "Payment successful",
  "attempts": 1,
  "routing": {
    "selectedProvider": "mpesa",
    "routingReason": "Selected for highest success rate",
    "score": 92.5,
    "estimatedFee": 75,
    "estimatedTime": 3000,
    "successProbability": 98.5,
    "alternatives": [
      { "provider": "airtel", "score": 85.2 },
      { "provider": "flutterwave", "score": 82.1 }
    ]
  }
}
```

---

### GET /api/v1/routing/payment

Get fee quotes from all eligible providers.

**Request:**
```
GET /api/v1/routing/payment?amount=5000&currency=KES&country=KE
```

**Response:**
```json
{
  "success": true,
  "requestId": "REQ-123456",
  "quotes": [
    {
      "providerId": "mpesa-id",
      "providerName": "M-Pesa Kenya",
      "feeType": "percentage",
      "feeAmount": 75,
      "feePercentage": 1.5,
      "totalAmount": 5075,
      "currency": "KES"
    },
    {
      "providerId": "airtel-id",
      "providerName": "Airtel Money",
      "feeType": "percentage",
      "feeAmount": 100,
      "feePercentage": 2.0,
      "totalAmount": 5100,
      "currency": "KES"
    }
  ],
  "bestQuote": {
    "providerId": "mpesa-id",
    "feeAmount": 75,
    "totalAmount": 5075
  }
}
```

---

### POST /api/v1/routing/cross-border

Find optimal cross-border payment route with FX optimization.

**Request:**
```json
{
  "sourceAmount": 1000,
  "sourceCurrency": "USD",
  "targetCurrency": "KES",
  "destinationCountry": "KE",
  "phoneNumber": "254712345678",
  "reference": "FX-123456",
  "description": "Cross-border payment",
  "execute": false
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "REQ-123456",
  "quote": {
    "sourceAmount": 1000,
    "sourceCurrency": "USD",
    "targetAmount": 129500,
    "targetCurrency": "KES",
    "exchangeRate": 129.5,
    "fees": {
      "fxFee": 1295,
      "providerFee": 15,
      "totalFees": 1310
    },
    "recipientGets": 128190,
    "route": {
      "provider": "flutterwave",
      "fxRoute": "direct",
      "legs": [
        { "fromCurrency": "USD", "toCurrency": "KES", "rate": 129.5 }
      ]
    }
  },
  "savings": {
    "amount": 500,
    "percentage": 0.39
  },
  "recommendation": "Best route: flutterwave via direct | Exchange rate: 1 USD = 129.5 KES | You save 0.39% (500 KES) vs alternative",
  "alternatives": [
    {
      "rank": 2,
      "provider": "mpesa",
      "recipientGets": 127690,
      "exchangeRate": 128.5,
      "totalFees": 1810
    }
  ]
}
```

---

### GET /api/v1/routing/health

Get health status of all payment providers.

**Request:**
```
GET /api/v1/routing/health
GET /api/v1/routing/health?status=HEALTHY
GET /api/v1/routing/health?region=east-africa
```

**Response:**
```json
{
  "success": true,
  "requestId": "REQ-123456",
  "summary": {
    "total": 17,
    "healthy": 14,
    "degraded": 2,
    "unhealthy": 1,
    "unknown": 0
  },
  "providers": [
    {
      "id": "provider-id",
      "name": "mpesa",
      "displayName": "M-Pesa Kenya",
      "region": "east-africa",
      "status": "HEALTHY",
      "isReachable": true,
      "responseTime": 2500,
      "successRate": 98.5,
      "avgResponseTime": 3000,
      "uptime": 99.2,
      "lastHealthCheck": "2024-01-15T10:30:00Z",
      "supportedCountries": ["KE"],
      "supportedCurrencies": ["KES", "USD"],
      "feePercentage": 1.5
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### GET /api/v1/routing/health/:providerId

Get detailed health status for a specific provider.

**Response:**
```json
{
  "success": true,
  "provider": {
    "id": "mpesa-id",
    "name": "mpesa",
    "displayName": "M-Pesa Kenya",
    "isActive": true,
    "priority": 1
  },
  "health": {
    "status": "HEALTHY",
    "isReachable": true,
    "responseTime": 2500,
    "lastCheck": "2024-01-15T10:30:00Z"
  },
  "metrics": {
    "successRate": 98.5,
    "avgResponseTime": 3000,
    "uptime": 99.2,
    "uptime24h": 99.8,
    "avgResponseTime24h": 2800,
    "transactionSuccessRate": 98.2
  },
  "statistics": {
    "totalTransactions24h": 1250,
    "successfulTransactions24h": 1227,
    "failedTransactions24h": 23,
    "healthChecks24h": 1440
  }
}
```

---

## Provider Scoring Algorithm

### Score Calculation

Each provider is scored on a 0-100 scale based on 5 factors:

```
Total Score = Success Rate (25%) + Cost (25%) + Speed (25%) + Availability (25%) + Priority (bonus)
```

### Factor Breakdown

| Factor | Weight | Calculation |
|--------|--------|-------------|
| **Success Rate** | 25 points | `(successRate / 100) * 25` |
| **Cost** | 25 points | `(1 - fee / maxAcceptableFee) * 25` |
| **Speed** | 25 points | `(1 - avgResponseTime / 30s) * 25` |
| **Availability** | 25 points | `HEALTHY=25, DEGRADED=15, UNHEALTHY=0` |
| **Priority** | Bonus | `(10 - priority) * 2.5` |

### Strategy Modifiers

Different strategies weight factors differently:

```typescript
// Cheapest strategy
costScore * 0.6 + successRateScore * 0.2 + availabilityScore * 0.2

// Fastest strategy
speedScore * 0.6 + successRateScore * 0.2 + availabilityScore * 0.2

// Success-optimized strategy
successRateScore * 0.5 + availabilityScore * 0.3 + costScore * 0.2

// Best-rate (balanced)
successRateScore * 0.3 + costScore * 0.25 + speedScore * 0.2 + availabilityScore * 0.15 + priorityScore * 0.1
```

---

## Routing Rules Engine

Routing rules allow you to define custom routing behavior based on conditions.

### Example Rules

```typescript
// Rule: High-value transactions use success-optimized routing
{
  name: 'High Value - Success Optimized',
  priority: 8,
  minAmount: 1000,
  currencies: ['USD', 'EUR', 'GBP'],
  strategy: 'success_rate_optimized',
  maxRetries: 3,
}

// Rule: Nigeria payments use Paystack first
{
  name: 'Nigeria - Paystack Primary',
  priority: 10,
  countries: ['NG'],
  currencies: ['NGN', 'USD'],
  providerTypes: ['paystack', 'flutterwave', 'opay'],
  strategy: 'primary_first',
  maxRetries: 2,
}

// Rule: Francophone countries prefer Orange Money
{
  name: 'Francophone - Orange Primary',
  priority: 9,
  countries: ['SN', 'CI', 'ML', 'BF'],
  currencies: ['XOF'],
  providerTypes: ['orange_money', 'wave', 'moov_money'],
  strategy: 'primary_first',
  maxRetries: 3,
}
```

### Rule Priority

Higher priority rules are evaluated first. If multiple rules match, the highest priority rule wins.

---

## Cross-Border FX Routing

### How It Works

1. **Find All Routes** - Discovers all possible paths between currency pairs
2. **Calculate Exchange Rates** - Gets rates for each leg of the journey
3. **Compare Total Cost** - Includes FX spread, margins, and provider fees
4. **Select Optimal Route** - Maximizes recipient amount

### Route Types

| Type | Description | Example |
|------|-------------|---------|
| **Direct** | Provider supports both currencies | USD → KES directly |
| **Via USD** | Convert through USD as intermediary | EUR → USD → KES |
| **Via EUR** | Convert through EUR as intermediary | GBP → EUR → KES |

### Example: Cross-Border Payment

```typescript
import { CrossBorderRoutingEngine } from '@/src/services/routing/cross-border-routing';

const fxEngine = new CrossBorderRoutingEngine();

// Find best route for USD to KES
const optimization = await fxEngine.findOptimalRoute({
  sourceAmount: 1000,
  sourceCurrency: 'USD',
  targetCurrency: 'KES',
  destinationCountry: 'KE',
});

console.log(optimization.recommendation);
// "Best route: flutterwave via direct | Exchange rate: 1 USD = 129.5 KES"
```

---

## Health Monitoring

### Background Monitoring

The health monitor runs continuously and:

- Checks each provider every 60 seconds (configurable)
- Tracks response times and success rates
- Marks providers as UNHEALTHY after 3 consecutive failures
- Updates provider metrics in real-time

### Manual Health Check

```typescript
import { providerHealthMonitor } from '@/src/services/routing/provider-health-monitor';

// Check specific provider
const report = await providerHealthMonitor.checkProvider('mpesa-id');

// Get all reports
const reports = await providerHealthMonitor.getHealthReports();

// Get unhealthy providers
const unhealthy = await providerHealthMonitor.getUnhealthyProviders();
```

### Health Status Values

| Status | Description | Routing Impact |
|--------|-------------|----------------|
| `HEALTHY` | Operating normally | Included in routing |
| `DEGRADED` | Slow or intermittent issues | Lower priority score |
| `UNHEALTHY` | Unreachable or failing | Excluded from routing |
| `UNKNOWN` | No health check data yet | Included with caution |

---

## Error Handling & Fallback

### Automatic Retry Logic

When a payment fails:

1. **Record Failure** - Log the failed attempt and provider
2. **Select Alternative** - Find next-best provider (excluding failed ones)
3. **Retry** - Attempt payment with new provider
4. **Repeat** - Continue until success or max retries reached

### Example: Fallback Flow

```
Attempt 1: M-Pesa (FAILED - timeout)
  ↓
Attempt 2: Airtel Money (FAILED - insufficient funds)
  ↓
Attempt 3: Flutterwave (SUCCESS)
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `ROUTING_ERROR` | No providers available | Check provider health |
| `PAYMENT_FAILED` | Provider rejected payment | Retry with alternative |
| `TIMEOUT` | Provider response timeout | Mark provider degraded, retry |
| `VALIDATION_ERROR` | Invalid request data | Fix request, don't retry |

---

## Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `payment_providers` | Provider configuration and metrics |
| `routing_rules` | Custom routing logic |
| `routed_transactions` | Track routing decisions and attempts |
| `provider_health_checks` | Health check history |
| `routing_metrics` | Aggregated performance metrics |
| `exchange_rates` | FX rates for cross-border routing |

### Query Examples

```prisma
// Get best provider for country
SELECT * FROM payment_providers
WHERE supported_countries @> ARRAY['KE']
  AND is_active = true
  AND success_rate > 95
ORDER BY priority ASC;

// Get recent health checks
SELECT * FROM provider_health_checks
WHERE provider_id = 'mpesa-id'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

// Get routing metrics by provider
SELECT 
  provider,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as successful,
  AVG(response_time) as avg_response_time
FROM routed_transactions
WHERE routed_at > NOW() - INTERVAL '7 days'
GROUP BY provider;
```

---

## Configuration

### Environment Variables

```env
# Routing Configuration
ROUTING_DEFAULT_STRATEGY=best_rate
ROUTING_MAX_RETRIES=3
ROUTING_HEALTH_CHECK_INTERVAL=60000

# Health Monitoring
HEALTH_CHECK_TIMEOUT=10000
HEALTH_UNHEALTHY_THRESHOLD=3
HEALTH_DEGRADED_RESPONSE_TIME=5000

# FX Configuration
FX_CACHE_TTL=300000
FX_DEFAULT_SPREAD=0.02
FX_DEFAULT_MARGIN=0.01
```

### Provider Configuration

Update provider settings via database:

```typescript
await prisma.paymentProvider.update({
  where: { name: 'mpesa' },
  data: {
    feePercentage: 1.5,
    priority: 1,
    maxTransactionAmount: 150000,
  },
});
```

---

## Monitoring & Analytics

### Key Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| **Routing Success Rate** | % of payments successfully routed | > 98% |
| **Average Attempts** | Avg attempts per successful payment | < 1.5 |
| **Provider Uptime** | % time providers are healthy | > 99% |
| **Cost Savings** | Savings from optimal routing | Track trend |
| **Response Time** | Avg routing decision time | < 100ms |

### Dashboard Queries

```typescript
// Get routing success rate by provider
const stats = await prisma.routedTransaction.groupBy({
  by: ['selectedProvider'],
  _count: { id: true },
  where: {
    routedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
});

// Get average attempts per successful payment
const avgAttempts = await prisma.routedTransaction.aggregate({
  _avg: { attemptNumber: true },
  where: { status: 'COMPLETED' },
});
```

---

## Best Practices

### 1. Always Use Routing

```typescript
// ❌ Don't: Hardcode provider
const result = await mpesaAPI.initiateSTKPush(request);

// ✅ Do: Use routing engine
const result = await routingEngine.executePayment(context, request);
```

### 2. Set Appropriate Max Retries

```typescript
// Low-value: 2 retries
await routingEngine.executePayment(context, request, { maxRetries: 2 });

// High-value: 3-4 retries
await routingEngine.executePayment(context, request, { maxRetries: 4 });
```

### 3. Monitor Provider Health

```typescript
// Start health monitoring on app startup
providerHealthMonitor.start();

// Check before critical payments
const health = await providerHealthMonitor.getProviderHealthReport('mpesa-id');
if (health.status !== ProviderStatus.HEALTHY) {
  // Use alternative provider
}
```

### 4. Use Routing Rules

Define rules for common scenarios:

```typescript
// High-value transactions
await prisma.routingRule.create({
  data: {
    name: 'High Value - Success Optimized',
    minAmount: 1000,
    strategy: 'success_rate_optimized',
    maxRetries: 4,
  },
});
```

### 5. Log Routing Decisions

```typescript
const result = await routingEngine.executePayment(context, request);

console.log('Payment routed:', {
  transactionId: result.transactionId,
  provider: result.provider,
  attempts: result.attempts,
  success: result.success,
});
```

---

## Troubleshooting

### Issue: No Providers Available

**Cause:** All providers marked unhealthy or filtered out

**Solution:**
```typescript
// Check provider health
const unhealthy = await providerHealthMonitor.getUnhealthyProviders();
console.log('Unhealthy providers:', unhealthy);

// Manually refresh health
await providerHealthMonitor.checkProvider('mpesa-id');

// Check routing filters
const eligible = await routingEngine.getEligibleProviders(context);
console.log('Eligible providers:', eligible);
```

### Issue: High Failure Rate

**Cause:** Provider experiencing issues

**Solution:**
```typescript
// Temporarily increase priority of alternative providers
await prisma.paymentProvider.updateMany({
  where: { name: { in: ['problematic_provider'] } },
  data: { priority: 10 }, // Lower priority
});

await prisma.paymentProvider.updateMany({
  where: { name: { in: ['reliable_provider'] } },
  data: { priority: 1 }, // Higher priority
});
```

### Issue: Slow Routing Decisions

**Cause:** Database queries or health checks blocking

**Solution:**
```typescript
// Enable caching
routingEngine.enableHealthCache(); // Cache health for 5 minutes

// Pre-fetch eligible providers
const eligible = await routingEngine.getEligibleProviders(context);
```

---

## Contributing

To add a new routing feature:

1. Create provider adapter in `src/lib/`
2. Add provider to seed data in `prisma/seed-routing.ts`
3. Update scoring factors if needed
4. Add routing rule if applicable
5. Update documentation

---

## License

Proprietary - WeduPay
