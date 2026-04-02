/**
 * Routing Network Seeder
 * 
 * Populates the database with payment providers,
 * routing rules, and initial configuration.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PAYMENT PROVIDERS CONFIGURATION
// ============================================

const paymentProviders = [
  // East Africa
  {
    name: 'mpesa',
    displayName: 'M-Pesa Kenya',
    region: 'east-africa',
    supportedCountries: ['KE'],
    supportedCurrencies: ['KES', 'USD'],
    priority: 1,
    feeType: 'percentage',
    feePercentage: 1.5,
    feeFixed: 0,
    feeMinimum: 0,
    minTransactionAmount: 1,
    maxTransactionAmount: 150000,
    successRate: 98.5,
    avgResponseTime: 3000,
  },
  {
    name: 'mpesa_tanzania',
    displayName: 'M-Pesa Tanzania',
    region: 'east-africa',
    supportedCountries: ['TZ'],
    supportedCurrencies: ['TZS', 'USD'],
    priority: 1,
    feeType: 'percentage',
    feePercentage: 1.5,
    feeFixed: 0,
    minTransactionAmount: 100,
    maxTransactionAmount: 2500000,
    successRate: 97.0,
    avgResponseTime: 4000,
  },
  {
    name: 'tigo_pesa',
    displayName: 'Tigo Pesa',
    region: 'east-africa',
    supportedCountries: ['TZ'],
    supportedCurrencies: ['TZS'],
    priority: 2,
    feeType: 'percentage',
    feePercentage: 1.8,
    minTransactionAmount: 100,
    maxTransactionAmount: 2000000,
    successRate: 95.0,
    avgResponseTime: 5000,
  },
  {
    name: 'airtel',
    displayName: 'Airtel Money',
    region: 'pan-african',
    supportedCountries: ['KE', 'TZ', 'UG', 'ZM', 'CD', 'MW', 'RW'],
    supportedCurrencies: ['USD', 'KES', 'TZS', 'UGX', 'ZMW', 'CDF'],
    priority: 3,
    feeType: 'percentage',
    feePercentage: 2.0,
    minTransactionAmount: 1,
    maxTransactionAmount: 100000,
    successRate: 94.0,
    avgResponseTime: 6000,
  },
  {
    name: 'mtn',
    displayName: 'MTN Mobile Money',
    region: 'pan-african',
    supportedCountries: ['UG', 'GH', 'CI', 'CM', 'ZM', 'RW', 'BJ'],
    supportedCurrencies: ['USD', 'UGX', 'GHS', 'XOF', 'XAF', 'ZMW', 'RWF'],
    priority: 2,
    feeType: 'percentage',
    feePercentage: 1.8,
    minTransactionAmount: 1,
    maxTransactionAmount: 500000,
    successRate: 96.0,
    avgResponseTime: 5000,
  },
  {
    name: 'ecocash',
    displayName: 'EcoCash',
    region: 'southern-africa',
    supportedCountries: ['ZW'],
    supportedCurrencies: ['USD', 'ZWL'],
    priority: 1,
    feeType: 'percentage',
    feePercentage: 2.0,
    minTransactionAmount: 1,
    maxTransactionAmount: 50000,
    successRate: 92.0,
    avgResponseTime: 7000,
  },
  {
    name: 'telecel',
    displayName: 'Telecel Cash',
    region: 'southern-africa',
    supportedCountries: ['ZW'],
    supportedCurrencies: ['USD', 'ZWL'],
    priority: 2,
    feeType: 'percentage',
    feePercentage: 2.2,
    minTransactionAmount: 1,
    maxTransactionAmount: 40000,
    successRate: 90.0,
    avgResponseTime: 8000,
  },
  {
    name: 'zamtel',
    displayName: 'Zamtel Money',
    region: 'southern-africa',
    supportedCountries: ['ZM'],
    supportedCurrencies: ['ZMW', 'USD'],
    priority: 2,
    feeType: 'percentage',
    feePercentage: 2.0,
    minTransactionAmount: 5,
    maxTransactionAmount: 100000,
    successRate: 93.0,
    avgResponseTime: 6000,
  },
  {
    name: 'halopesa',
    displayName: 'Halopesa',
    region: 'southern-africa',
    supportedCountries: ['MZ'],
    supportedCurrencies: ['MZN', 'USD'],
    priority: 1,
    feeType: 'percentage',
    feePercentage: 2.5,
    minTransactionAmount: 10,
    maxTransactionAmount: 200000,
    successRate: 91.0,
    avgResponseTime: 7000,
  },

  // West Africa - Anglophone
  {
    name: 'paystack',
    displayName: 'Paystack',
    region: 'west-africa',
    supportedCountries: ['NG', 'GH', 'KE', 'ZA'],
    supportedCurrencies: ['NGN', 'GHS', 'KES', 'ZAR', 'USD', 'GBP'],
    priority: 1,
    feeType: 'percentage',
    feePercentage: 1.5,
    feeFixed: 0,
    feeMinimum: 0,
    minTransactionAmount: 1,
    maxTransactionAmount: 10000000,
    successRate: 99.0,
    avgResponseTime: 2000,
  },
  {
    name: 'flutterwave',
    displayName: 'Flutterwave',
    region: 'pan-african',
    supportedCountries: ['NG', 'GH', 'KE', 'ZA', 'TZ', 'UG', 'RW', 'ZM', 'MW', 'ZW'],
    supportedCurrencies: ['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'RWF', 'ZMW', 'USD', 'EUR', 'GBP'],
    priority: 2,
    feeType: 'percentage',
    feePercentage: 1.8,
    minTransactionAmount: 1,
    maxTransactionAmount: 50000000,
    successRate: 98.0,
    avgResponseTime: 3000,
  },
  {
    name: 'opay',
    displayName: 'OPay',
    region: 'west-africa',
    supportedCountries: ['NG', 'EG'],
    supportedCurrencies: ['NGN', 'EGP'],
    priority: 2,
    feeType: 'percentage',
    feePercentage: 1.0,
    minTransactionAmount: 1,
    maxTransactionAmount: 5000000,
    successRate: 97.5,
    avgResponseTime: 2500,
  },
  {
    name: 'palmpay',
    displayName: 'PalmPay',
    region: 'west-africa',
    supportedCountries: ['NG', 'GH'],
    supportedCurrencies: ['NGN', 'GHS'],
    priority: 3,
    feeType: 'percentage',
    feePercentage: 1.2,
    minTransactionAmount: 1,
    maxTransactionAmount: 3000000,
    successRate: 96.5,
    avgResponseTime: 3000,
  },

  // West Africa - Francophone
  {
    name: 'orange_money',
    displayName: 'Orange Money',
    region: 'west-africa',
    supportedCountries: ['SN', 'CI', 'ML', 'BF', 'CM', 'MG', 'BW', 'CD'],
    supportedCurrencies: ['XOF', 'XAF', 'EUR', 'USD'],
    priority: 1,
    feeType: 'percentage',
    feePercentage: 2.0,
    minTransactionAmount: 100,
    maxTransactionAmount: 5000000,
    successRate: 95.0,
    avgResponseTime: 5000,
  },
  {
    name: 'wave',
    displayName: 'Wave',
    region: 'west-africa',
    supportedCountries: ['SN', 'CI', 'ML', 'BF'],
    supportedCurrencies: ['XOF'],
    priority: 2,
    feeType: 'percentage',
    feePercentage: 1.0,
    minTransactionAmount: 50,
    maxTransactionAmount: 3000000,
    successRate: 97.0,
    avgResponseTime: 4000,
  },
  {
    name: 'moov_money',
    displayName: 'Moov Money',
    region: 'west-africa',
    supportedCountries: ['BJ', 'TG', 'CI', 'NE', 'GA', 'CF', 'TD'],
    supportedCurrencies: ['XOF', 'XAF'],
    priority: 3,
    feeType: 'percentage',
    feePercentage: 2.2,
    minTransactionAmount: 100,
    maxTransactionAmount: 2000000,
    successRate: 93.0,
    avgResponseTime: 6000,
  },

  // Pan-African Aggregators
  {
    name: 'africas_talking',
    displayName: "Africa's Talking",
    region: 'pan-african',
    supportedCountries: ['KE', 'UG', 'TZ', 'NG', 'GH'],
    supportedCurrencies: ['KES', 'UGX', 'TZS', 'NGN', 'GHS', 'USD'],
    priority: 4,
    feeType: 'percentage',
    feePercentage: 2.5,
    minTransactionAmount: 1,
    maxTransactionAmount: 1000000,
    successRate: 96.0,
    avgResponseTime: 4000,
  },
];

// ============================================
// ROUTING RULES CONFIGURATION
// ============================================

const routingRules = [
  {
    name: 'Kenya - Best Rate',
    description: 'Route Kenya payments through best performing provider',
    priority: 10,
    countries: ['KE'],
    currencies: ['KES', 'USD'],
    strategy: 'best_rate',
    maxRetries: 2,
  },
  {
    name: 'Nigeria - Primary First',
    description: 'Use Paystack as primary for Nigeria',
    priority: 10,
    countries: ['NG'],
    currencies: ['NGN', 'USD'],
    providerTypes: ['paystack', 'flutterwave', 'opay'],
    strategy: 'primary_first',
    maxRetries: 2,
  },
  {
    name: 'Ghana - Cheapest',
    description: 'Route Ghana payments through lowest cost provider',
    priority: 10,
    countries: ['GH'],
    currencies: ['GHS', 'USD'],
    strategy: 'cheapest',
    maxRetries: 2,
  },
  {
    name: 'Francophone West Africa - Orange Primary',
    description: 'Use Orange Money as primary for Francophone countries',
    priority: 9,
    countries: ['SN', 'CI', 'ML', 'BF'],
    currencies: ['XOF'],
    providerTypes: ['orange_money', 'wave', 'moov_money'],
    strategy: 'primary_first',
    maxRetries: 3,
  },
  {
    name: 'Tanzania - M-Pesa Primary',
    description: 'Use M-Pesa Tanzania as primary',
    priority: 10,
    countries: ['TZ'],
    currencies: ['TZS'],
    providerTypes: ['mpesa_tanzania', 'tigo_pesa', 'airtel'],
    strategy: 'primary_first',
    maxRetries: 2,
  },
  {
    name: 'Zimbabwe - EcoCash Primary',
    description: 'Use EcoCash as primary for Zimbabwe',
    priority: 10,
    countries: ['ZW'],
    currencies: ['USD', 'ZWL'],
    providerTypes: ['ecocash', 'telecel'],
    strategy: 'primary_first',
    maxRetries: 3,
  },
  {
    name: 'High Value Transactions - Success Optimized',
    description: 'For transactions over $1000, prioritize success rate',
    priority: 8,
    minAmount: 1000,
    currencies: ['USD', 'EUR', 'GBP'],
    strategy: 'success_rate_optimized',
    maxRetries: 3,
  },
  {
    name: 'Low Value Transactions - Cheapest',
    description: 'For transactions under $10, prioritize lowest fees',
    priority: 7,
    maxAmount: 10,
    currencies: ['USD', 'KES', 'NGN', 'GHS'],
    strategy: 'cheapest',
    maxRetries: 2,
  },
  {
    name: 'Pan-African - Flutterwave Fallback',
    description: 'Use Flutterwave for cross-border pan-African payments',
    priority: 6,
    countries: ['NG', 'GH', 'KE', 'ZA', 'TZ', 'UG', 'RW', 'ZM'],
    currencies: ['USD'],
    providerTypes: ['flutterwave'],
    strategy: 'best_rate',
    maxRetries: 2,
  },
];

// ============================================
// EXCHANGE RATES (Initial)
// ============================================

const exchangeRates = [
  { base: 'USD', target: 'KES', rate: 129.5 },
  { base: 'USD', target: 'NGN', rate: 1545 },
  { base: 'USD', target: 'GHS', rate: 15.2 },
  { base: 'USD', target: 'ZAR', rate: 18.5 },
  { base: 'USD', target: 'TZS', rate: 2520 },
  { base: 'USD', target: 'UGX', rate: 3720 },
  { base: 'USD', target: 'ZMW', rate: 26.5 },
  { base: 'USD', target: 'XOF', rate: 605 },
  { base: 'USD', target: 'XAF', rate: 605 },
  { base: 'USD', target: 'MZN', rate: 63.5 },
  { base: 'USD', target: 'EUR', rate: 0.92 },
  { base: 'USD', target: 'GBP', rate: 0.79 },
  { base: 'EUR', target: 'XOF', rate: 655.957 },
  { base: 'EUR', target: 'XAF', rate: 655.957 },
  { base: 'GBP', target: 'KES', rate: 164.0 },
  { base: 'GBP', target: 'NGN', rate: 1955.0 },
];

// ============================================
// SEED FUNCTION
// ============================================

async function seed() {
  console.log('🌱 Starting routing network seed...');

  // Seed Payment Providers
  console.log('\n📦 Seeding Payment Providers...');
  for (const providerData of paymentProviders) {
    const provider = await prisma.paymentProvider.upsert({
      where: { name: providerData.name },
      update: providerData,
      create: providerData,
    });
    console.log(`  ✓ ${provider.displayName} (${provider.name})`);
  }

  // Seed Routing Rules
  console.log('\n📋 Seeding Routing Rules...');
  for (const ruleData of routingRules) {
    // Check if rule exists by name
    const existingRule = await prisma.routingRule.findFirst({
      where: { name: ruleData.name },
    });

    if (existingRule) {
      await prisma.routingRule.update({
        where: { id: existingRule.id },
        data: ruleData,
      });
    } else {
      const rule = await prisma.routingRule.create({
        data: ruleData,
      });
      console.log(`  ✓ ${rule.name}`);
    }
  }

  // Seed Exchange Rates
  console.log('\n💱 Seeding Exchange Rates...');
  for (const rateData of exchangeRates) {
    const rate = await prisma.exchangeRate.create({
      data: {
        baseCurrency: rateData.base,
        targetCurrency: rateData.target,
        rate: rateData.rate,
        inverseRate: 1 / rateData.rate,
        source: 'market',
        spread: 0.02,
        margin: 0.01,
        isValid: true,
      },
    });
    console.log(`  ✓ 1 ${rateData.base} = ${rateData.rate} ${rateData.target}`);
  }

  console.log('\n✅ Routing network seed completed!');
  console.log('\n📊 Summary:');
  console.log(`  - Payment Providers: ${paymentProviders.length}`);
  console.log(`  - Routing Rules: ${routingRules.length}`);
  console.log(`  - Exchange Rates: ${exchangeRates.length}`);

  // Seed Transfer Limits
  console.log('\n💰 Seeding Transfer Limits...');
  await seedTransferLimits();
}

// ============================================
// TRANSFER LIMITS
// ============================================

async function seedTransferLimits() {
  const transferLimits = [
    // East Africa
    { country: 'KE', currency: 'KES', walletType: 'mobile_wallet', dailyMin: 10, dailyMax: 150000, transactionMin: 10, transactionMax: 50000, monthlyMax: 300000 },
    { country: 'TZ', currency: 'TZS', walletType: 'mobile_wallet', dailyMin: 1000, dailyMax: 5000000, transactionMin: 1000, transactionMax: 1500000, monthlyMax: 15000000 },
    { country: 'UG', currency: 'UGX', walletType: 'mobile_wallet', dailyMin: 1000, dailyMax: 5000000, transactionMin: 1000, transactionMax: 1500000, monthlyMax: 15000000 },
    
    // West Africa
    { country: 'NG', currency: 'NGN', walletType: 'mobile_wallet', dailyMin: 100, dailyMax: 1000000, transactionMin: 100, transactionMax: 500000, monthlyMax: 5000000 },
    { country: 'GH', currency: 'GHS', walletType: 'mobile_wallet', dailyMin: 1, dailyMax: 10000, transactionMin: 1, transactionMax: 5000, monthlyMax: 50000 },
    { country: 'SN', currency: 'XOF', walletType: 'mobile_wallet', dailyMin: 100, dailyMax: 1000000, transactionMin: 100, transactionMax: 500000, monthlyMax: 5000000 },
    { country: 'CI', currency: 'XOF', walletType: 'mobile_wallet', dailyMin: 100, dailyMax: 1000000, transactionMin: 100, transactionMax: 500000, monthlyMax: 5000000 },
    { country: 'ML', currency: 'XOF', walletType: 'mobile_wallet', dailyMin: 100, dailyMax: 1000000, transactionMin: 100, transactionMax: 500000, monthlyMax: 5000000 },
    { country: 'BF', currency: 'XOF', walletType: 'mobile_wallet', dailyMin: 100, dailyMax: 1000000, transactionMin: 100, transactionMax: 500000, monthlyMax: 5000000 },
    
    // Southern Africa
    { country: 'ZW', currency: 'USD', walletType: 'mobile_wallet', dailyMin: 1, dailyMax: 10000, transactionMin: 1, transactionMax: 5000, monthlyMax: 50000 },
    { country: 'ZM', currency: 'ZMW', walletType: 'mobile_wallet', dailyMin: 10, dailyMax: 100000, transactionMin: 10, transactionMax: 50000, monthlyMax: 500000 },
    { country: 'MZ', currency: 'MZN', walletType: 'mobile_wallet', dailyMin: 100, dailyMax: 100000, transactionMin: 100, transactionMax: 50000, monthlyMax: 500000 },
    
    // Central Africa
    { country: 'CM', currency: 'XAF', walletType: 'mobile_wallet', dailyMin: 500, dailyMax: 5000000, transactionMin: 500, transactionMax: 2000000, monthlyMax: 20000000 },
    
    // USD limits (for cross-border)
    { country: 'KE', currency: 'USD', walletType: 'mobile_wallet', dailyMin: 1, dailyMax: 1000, transactionMin: 1, transactionMax: 500, monthlyMax: 5000 },
    { country: 'NG', currency: 'USD', walletType: 'mobile_wallet', dailyMin: 1, dailyMax: 1000, transactionMin: 1, transactionMax: 500, monthlyMax: 5000 },
    { country: 'GH', currency: 'USD', walletType: 'mobile_wallet', dailyMin: 1, dailyMax: 1000, transactionMin: 1, transactionMax: 500, monthlyMax: 5000 },
    { country: 'ZA', currency: 'USD', walletType: 'mobile_wallet', dailyMin: 1, dailyMax: 2000, transactionMin: 1, transactionMax: 1000, monthlyMax: 10000 },
  ];

  for (const limitData of transferLimits) {
    await prisma.transferLimit.upsert({
      where: {
        country_currency_walletType: {
          country: limitData.country,
          currency: limitData.currency,
          walletType: limitData.walletType,
        },
      },
      update: limitData,
      create: limitData,
    });
  }

  console.log(`  ✓ Transfer Limits: ${transferLimits.length}`);
}

// ============================================
// RUN SEED
// ============================================

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default seed;
