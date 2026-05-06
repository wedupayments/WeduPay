import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TRACKED_SYMBOLS = [
  'USD',
  'EUR',
  'GBP',
  'KES',
  'NGN',
  'GHS',
  'ZAR',
  'TZS',
  'UGX',
  'ZMW',
  'XOF',
  'XAF',
  'MZN',
  'ZWL',
];

async function main() {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;

  if (!appId) {
    throw new Error('OPEN_EXCHANGE_RATES_APP_ID is required to seed FX rates.');
  }

  console.log('🌍 Seeding FX exchange rates from Open Exchange Rates...');

  const params = new URLSearchParams({
    app_id: appId,
    prettyprint: '0',
    symbols: TRACKED_SYMBOLS.filter((symbol) => symbol !== 'USD').join(','),
  });

  const response = await fetch(`https://openexchangerates.org/api/latest.json?${params.toString()}`);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.description || data.message || 'Failed to fetch FX seed data');
  }

  // Delete existing rates
  await prisma.exchangeRate.deleteMany({});

  // Create new rates
  const timestamp = new Date(data.timestamp * 1000);
  const validUntil = new Date(timestamp.getTime() + 60 * 60 * 1000);
  const entries = Object.entries(data.rates as Record<string, number>).filter(
    ([target, rate]) => target !== 'USD' && typeof rate === 'number' && rate > 0
  );

  for (const [target, rate] of entries) {
    await prisma.exchangeRate.create({
      data: {
        baseCurrency: 'USD',
        targetCurrency: target,
        rate,
        inverseRate: 1 / rate,
        source: 'open_exchange_rates',
        provider: 'openexchangerates',
        isValid: true,
        validFrom: timestamp,
        validUntil,
        spread: 0.01, // 1% spread
        margin: 0.005, // 0.5% margin
      },
    });
  }

  console.log(`✅ Created ${entries.length} exchange rates from Open Exchange Rates`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
