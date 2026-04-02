# Database Changes Summary - Money Routing Network

## ✅ Changes Applied

The following changes have been applied to your PostgreSQL database:

### New Tables Created (6)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `payment_providers` | Provider configuration & metrics | `id`, `name`, `region`, `success_rate`, `fee_percentage`, `priority` |
| `routing_rules` | Custom routing logic | `id`, `name`, `strategy`, `countries`, `currencies` |
| `routed_transactions` | Track routing decisions | `id`, `transaction_id`, `selected_provider`, `status`, `attempt_number` |
| `provider_health_checks` | Health check history | `id`, `provider_id`, `status`, `response_time` |
| `routing_metrics` | Aggregated performance | `date`, `provider`, `country`, `total_transactions` |
| `exchange_rates` | FX rates for cross-border | `base_currency`, `target_currency`, `rate`, `spread` |

### Existing Tables Modified

| Table | Change |
|-------|--------|
| `wallets` | Updated comment for `walletType` to include new providers |

### Indexes Created

```sql
-- payment_providers
CREATE INDEX "payment_providers_region_idx" ON "payment_providers"("region");
CREATE INDEX "payment_providers_isActive_idx" ON "payment_providers"("isActive");
CREATE INDEX "payment_providers_priority_idx" ON "payment_providers"("priority");

-- routing_rules
CREATE INDEX "routing_rules_isActive_idx" ON "routing_rules"("isActive");
CREATE INDEX "routing_rules_priority_idx" ON "routing_rules"("priority");
CREATE INDEX "routing_rules_countries_idx" ON "routing_rules"("countries");

-- routed_transactions
CREATE INDEX "routed_transactions_transactionId_idx" ON "routed_transactions"("transactionId");
CREATE INDEX "routed_transactions_userId_idx" ON "routed_transactions"("userId");
CREATE INDEX "routed_transactions_status_idx" ON "routed_transactions"("status");
CREATE INDEX "routed_transactions_selectedProvider_idx" ON "routed_transactions"("selectedProvider");
CREATE INDEX "routed_transactions_routedAt_idx" ON "routed_transactions"("routedAt");

-- provider_health_checks
CREATE INDEX "provider_health_checks_providerId_idx" ON "provider_health_checks"("providerId");
CREATE INDEX "provider_health_checks_status_idx" ON "provider_health_checks"("status");
CREATE INDEX "provider_health_checks_createdAt_idx" ON "provider_health_checks"("createdAt");

-- routing_metrics
CREATE INDEX "routing_metrics_date_idx" ON "routing_metrics"("date");
CREATE INDEX "routing_metrics_provider_idx" ON "routing_metrics"("provider");

-- exchange_rates
CREATE INDEX "exchange_rates_baseCurrency_idx" ON "exchange_rates"("baseCurrency");
CREATE INDEX "exchange_rates_targetCurrency_idx" ON "exchange_rates"("targetCurrency");
```

### Unique Constraints

```sql
-- routing_metrics
CREATE UNIQUE INDEX "routing_metrics_date_provider_country_currency_key" 
  ON "routing_metrics"("date", "provider", "country", "currency");

-- exchange_rates
CREATE UNIQUE INDEX "exchange_rates_baseCurrency_targetCurrency_source_provider_key" 
  ON "exchange_rates"("baseCurrency", "targetCurrency", "source", "provider");
```

### Foreign Keys

```sql
-- routed_transactions → payment_providers
ALTER TABLE "routed_transactions" 
  ADD CONSTRAINT "routed_transactions_selectedProviderId_fkey" 
  FOREIGN KEY ("selectedProviderId") REFERENCES "payment_providers"("id");

-- provider_health_checks → payment_providers
ALTER TABLE "provider_health_checks" 
  ADD CONSTRAINT "provider_health_checks_providerId_fkey" 
  FOREIGN KEY ("providerId") REFERENCES "payment_providers"("id");

-- routing_rules → payment_providers
ALTER TABLE "routing_rules" 
  ADD CONSTRAINT "routing_rules_primaryProviderId_fkey" 
  FOREIGN KEY ("primaryProviderId") REFERENCES "payment_providers"("id");
```

---

## 📊 Seed Data Populated

### Payment Providers (17)

| Provider | Region | Countries | Fee % | Priority |
|----------|--------|-----------|-------|----------|
| M-Pesa Kenya | east-africa | KE | 1.5% | 1 |
| M-Pesa Tanzania | east-africa | TZ | 1.5% | 1 |
| Tigo Pesa | east-africa | TZ | 1.8% | 2 |
| Airtel Money | pan-african | KE,TZ,UG,ZM,CD,MW,RW | 2.0% | 3 |
| MTN Mobile Money | pan-african | UG,GH,CI,CM,ZM,RW,BJ | 1.8% | 2 |
| EcoCash | southern-africa | ZW | 2.0% | 1 |
| Telecel Cash | southern-africa | ZW | 2.2% | 2 |
| Zamtel Money | southern-africa | ZM | 2.0% | 2 |
| Halopesa | southern-africa | MZ | 2.5% | 1 |
| Paystack | west-africa | NG,GH,KE,ZA | 1.5% | 1 |
| Flutterwave | pan-african | NG,GH,KE,ZA,TZ,UG,RW,ZM,MW,ZW | 1.8% | 2 |
| OPay | west-africa | NG,EG | 1.0% | 2 |
| PalmPay | west-africa | NG,GH | 1.2% | 3 |
| Orange Money | west-africa | SN,CI,ML,BF,CM,MG,BW,CD | 2.0% | 1 |
| Wave | west-africa | SN,CI,ML,BF | 1.0% | 2 |
| Moov Money | west-africa | BJ,TG,CI,NE,GA,CF,TD | 2.2% | 3 |
| Africa's Talking | pan-african | KE,UG,TZ,NG,GH | 2.5% | 4 |

### Routing Rules (9)

| Rule Name | Strategy | Countries | Priority |
|-----------|----------|-----------|----------|
| Kenya - Best Rate | best_rate | KE | 10 |
| Nigeria - Primary First | primary_first | NG | 10 |
| Ghana - Cheapest | cheapest | GH | 10 |
| Francophone West Africa - Orange Primary | primary_first | SN,CI,ML,BF | 9 |
| Tanzania - M-Pesa Primary | primary_first | TZ | 10 |
| Zimbabwe - EcoCash Primary | primary_first | ZW | 10 |
| High Value Transactions - Success Optimized | success_rate_optimized | - | 8 |
| Low Value Transactions - Cheapest | cheapest | - | 7 |
| Pan-African - Flutterwave Fallback | best_rate | NG,GH,KE,ZA,TZ,UG,RW,ZM | 6 |

### Exchange Rates (16)

```
1 USD = 129.5 KES
1 USD = 1545 NGN
1 USD = 15.2 GHS
1 USD = 18.5 ZAR
1 USD = 2520 TZS
1 USD = 3720 UGX
1 USD = 26.5 ZMW
1 USD = 605 XOF
1 USD = 605 XAF
1 USD = 63.5 MZN
1 USD = 0.92 EUR
1 USD = 0.79 GBP
1 EUR = 655.957 XOF
1 EUR = 655.957 XAF
1 GBP = 164 KES
1 GBP = 1955 NGN
```

---

## 🔍 Verify Database

Run these queries to verify the setup:

```sql
-- Check payment providers
SELECT name, displayName, region, successRate, feePercentage, priority 
FROM payment_providers 
ORDER BY priority;

-- Check routing rules
SELECT name, strategy, countries, priority 
FROM routing_rules 
ORDER BY priority DESC;

-- Check exchange rates
SELECT baseCurrency, targetCurrency, rate 
FROM exchange_rates 
WHERE baseCurrency = 'USD' 
ORDER BY targetCurrency;

-- Check provider health (after monitoring starts)
SELECT p.name, h.status, h.responseTime, h.createdAt 
FROM payment_providers p
LEFT JOIN provider_health_checks h ON p.id = h.providerId
WHERE h.createdAt > NOW() - INTERVAL '1 hour';
```

---

## 🚀 Next Steps

### 1. Start Health Monitoring

Add to your app initialization (e.g., `layout.tsx` or API route):

```typescript
import { providerHealthMonitor } from '@/src/services/routing/provider-health-monitor';

// Start background health monitoring
providerHealthMonitor.start();
```

### 2. Test Routing API

```bash
# Get fee quotes
curl "http://localhost:3000/api/v1/routing/payment?amount=5000&currency=KES&country=KE"

# Get provider health
curl http://localhost:3000/api/v1/routing/health

# Route a payment
curl -X POST http://localhost:3000/api/v1/routing/payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "KES",
    "country": "KE",
    "phoneNumber": "254712345678",
    "reference": "TEST-123",
    "description": "Test payment"
  }'
```

### 3. Update Prisma Client

```bash
npx prisma generate
```

---

## 📝 Migration Files

Migration files are stored in:
```
prisma/migrations/
  └── YYYYMMDDHHMMSS_add_routing_network/
      ├── migration.sql
      └── migration_lock.toml
```

---

## ⚠️ Important Notes

1. **Provider Credentials**: The seed populates provider configurations but NOT credentials. Update credentials in your `.env.local` file.

2. **Health Monitoring**: Providers start with default health status. The health monitor will update these after it runs.

3. **Exchange Rates**: Initial rates are placeholder values. Integrate with a real FX API (Fixer.io, Open Exchange Rates) for live rates.

4. **Customization**: Review and adjust provider fees, priorities, and limits in the `payment_providers` table based on your negotiated rates.

---

## 🔧 Manual Configuration (Optional)

Update provider credentials in database:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Update M-Pesa credentials (encrypted)
await prisma.paymentProvider.update({
  where: { name: 'mpesa' },
  data: {
    credentials: JSON.stringify({
      consumerKey: 'your-key',
      consumerSecret: 'your-secret',
      shortCode: '600000',
      passkey: 'your-passkey',
    }),
  },
});
```

Or update via environment variables in the routing engine (current approach).
