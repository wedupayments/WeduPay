import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample exchange rates (you should replace with real API data)
const EXCHANGE_RATES = [
  // USD base rates
  { from: 'USD', to: 'ZWL', rate: 322.0, source: 'manual' },
  { from: 'USD', to: 'ZAR', rate: 18.5, source: 'manual' },
  { from: 'USD', to: 'KES', rate: 129.5, source: 'manual' },
  { from: 'USD', to: 'NGN', rate: 775.0, source: 'manual' },
  { from: 'USD', to: 'GHS', rate: 12.1, source: 'manual' },
  { from: 'USD', to: 'UGX', rate: 3700.0, source: 'manual' },
  { from: 'USD', to: 'TZS', rate: 2520.0, source: 'manual' },
  { from: 'USD', to: 'EUR', rate: 0.92, source: 'manual' },
  { from: 'USD', to: 'GBP', rate: 0.79, source: 'manual' },

  // ZAR base rates
  { from: 'ZAR', to: 'USD', rate: 0.054, source: 'manual' },
  { from: 'ZAR', to: 'ZWL', rate: 17.4, source: 'manual' },
  { from: 'ZAR', to: 'KES', rate: 7.0, source: 'manual' },
  { from: 'ZAR', to: 'NGN', rate: 41.9, source: 'manual' },

  // KES base rates
  { from: 'KES', to: 'USD', rate: 0.0077, source: 'manual' },
  { from: 'KES', to: 'ZAR', rate: 0.14, source: 'manual' },
  { from: 'KES', to: 'NGN', rate: 5.98, source: 'manual' },
  { from: 'KES', to: 'UGX', rate: 28.6, source: 'manual' },
  { from: 'KES', to: 'TZS', rate: 19.5, source: 'manual' },

  // NGN base rates
  { from: 'NGN', to: 'USD', rate: 0.0013, source: 'manual' },
  { from: 'NGN', to: 'ZAR', rate: 0.024, source: 'manual' },
  { from: 'NGN', to: 'KES', rate: 0.167, source: 'manual' },
  { from: 'NGN', to: 'GHS', rate: 0.016, source: 'manual' },
];

async function main() {
  console.log('🌍 Seeding FX exchange rates...');

  // Delete existing rates
  await prisma.exchangeRate.deleteMany({});

  // Create new rates
  for (const rate of EXCHANGE_RATES) {
    await prisma.exchangeRate.create({
      data: {
        baseCurrency: rate.from,
        targetCurrency: rate.to,
        rate: rate.rate,
        inverseRate: 1 / rate.rate,
        source: rate.source,
        provider: 'manual',
        isValid: true,
        spread: 0.01, // 1% spread
        margin: 0.005, // 0.5% margin
      },
    });
  }

  console.log(`✅ Created ${EXCHANGE_RATES.length} exchange rates`);
  console.log('\nSample rates:');
  console.log('  1 USD = 322.00 ZWL');
  console.log('  1 USD = 18.50 ZAR');
  console.log('  1 USD = 129.50 KES');
  console.log('  1 USD = 775.00 NGN');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
