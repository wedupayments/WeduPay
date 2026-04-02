/**
 * Quick Database Test Script
 * Verifies database connection and data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test counts
    const [
      users,
      transfers,
      providers,
      wallets,
      routingRules,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.p2PTransfer.count(),
      prisma.paymentProvider.count(),
      prisma.wallet.count(),
      prisma.routingRule.count(),
    ]);

    console.log('✅ Database Connection: SUCCESS\n');
    console.log('📊 Database Statistics:');
    console.log('   ├─ Users:', users);
    console.log('   ├─ Transfers:', transfers);
    console.log('   ├─ Payment Providers:', providers);
    console.log('   ├─ Wallets:', wallets);
    console.log('   └─ Routing Rules:', routingRules);

    // Test provider data
    console.log('\n📦 Payment Providers:');
    const providerList = await prisma.paymentProvider.findMany({
      select: {
        name: true,
        displayName: true,
        isActive: true,
        successRate: true,
      },
      take: 5,
    });

    providerList.forEach(p => {
      console.log(`   ├─ ${p.displayName} (${p.name}) - ${p.isActive ? '✅ Active' : '❌ Inactive'} - ${p.successRate}% success`);
    });

    console.log('\n✅ All tests passed! Your database is working correctly.\n');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
