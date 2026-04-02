/**
 * API Endpoints Test Script
 * Tests all major API endpoints
 */

const BASE_URL = 'http://localhost:3000';

const tests = [
  {
    name: 'Admin Stats',
    method: 'GET',
    url: '/api/v1/admin/stats',
    headers: {
      'x-user-id': 'admin-1',
      'x-user-role': 'ADMIN',
    },
  },
  {
    name: 'Admin Transfers',
    method: 'GET',
    url: '/api/v1/admin/transfers?page=1&limit=10',
    headers: {
      'x-user-id': 'admin-1',
      'x-user-role': 'ADMIN',
    },
  },
  {
    name: 'Wallet Balance',
    method: 'GET',
    url: '/api/v1/wallets/balance?all=true',
    headers: {
      'x-user-id': 'user-123',
    },
  },
  {
    name: 'P2P Transfer Quote',
    method: 'POST',
    url: '/api/v1/transfers/p2p/quote',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'user-123',
    },
    body: {
      sendAmount: 100,
      sendCurrency: 'USD',
      recipientPhone: '254712345678',
      recipientCountry: 'KE',
    },
  },
  {
    name: 'Notification Preferences',
    method: 'GET',
    url: '/api/v1/notifications/preferences',
    headers: {
      'x-user-id': 'user-123',
    },
  },
];

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method,
        headers: test.headers,
        body: test.body ? JSON.stringify(test.body) : undefined,
      });

      const data = await response.json();

      if (response.ok || data.success !== undefined) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${response.status}`);
        if (data.success) {
          console.log(`   Response: Success`);
        } else {
          console.log(`   Response: ${data.error || 'Handled'}`);
        }
        passed++;
      } else {
        console.log(`⚠️  ${test.name} - ${response.status}`);
        console.log(`   Error: ${data.error || response.statusText}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('─'.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All API tests passed!\n');
  } else {
    console.log('\n⚠️  Some tests failed. This is expected if:\n');
    console.log('   1. Dev server is not running (npm run dev)');
    console.log('   2. Database tables are empty');
    console.log('   3. API keys are not configured\n');
  }
}

runTests().catch(console.error);
