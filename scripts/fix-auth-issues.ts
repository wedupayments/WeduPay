/**
 * Auth Issues Fix Script
 * 
 * Fixes common authentication issues:
 * - Links Supabase users to existing email profiles
 * - Creates missing profiles for authenticated users
 * - Updates country codes to 2-letter format
 * 
 * Usage: npx tsx scripts/fix-auth-issues.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const COUNTRY_MAP: Record<string, string> = {
  'Zimbabwe': 'ZW',
  'Kenya': 'KE',
  'Nigeria': 'NG',
  'Ghana': 'GH',
  'Uganda': 'UG',
  'Tanzania': 'TZ',
  'Zambia': 'ZM',
  'Mozambique': 'MZ',
  'South Africa': 'ZA',
};

async function fixCountryCodes() {
  console.log('\n🔧 Fixing country codes...');
  
  const users = await prisma.user.findMany({
    where: {
      country: {
        notIn: Object.values(COUNTRY_MAP),
      },
    },
  });

  for (const user of users) {
    const countryCode = COUNTRY_MAP[user.country];
    if (countryCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: { country: countryCode },
      });
      console.log(`  ✅ Updated ${user.email}: ${user.country} → ${countryCode}`);
    } else {
      console.log(`  ⚠️  Unknown country for ${user.email}: ${user.country}`);
    }
  }
}

async function linkSupabaseUsers() {
  console.log('\n🔗 Linking Supabase users to profiles...');
  
  // Get all Supabase users
  const { data: { users: supabaseUsers }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Failed to fetch Supabase users:', error);
    return;
  }

  console.log(`  Found ${supabaseUsers.length} Supabase users`);

  for (const supabaseUser of supabaseUsers) {
    const email = supabaseUser.email?.toLowerCase();
    if (!email) continue;

    // Check if already linked
    const linkedProfile = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id },
    });

    if (linkedProfile) {
      console.log(`  ✓ ${email} already linked`);
      continue;
    }

    // Find profile by email
    const profile = await prisma.user.findUnique({
      where: { email },
    });

    if (profile) {
      // Link the profile
      await prisma.user.update({
        where: { id: profile.id },
        data: { supabaseUserId: supabaseUser.id },
      });
      console.log(`  ✅ Linked ${email} to Supabase user`);
    } else {
      console.log(`  ⚠️  No profile found for ${email} - user needs to complete registration`);
    }
  }
}

async function createMissingWallets() {
  console.log('\n💰 Creating missing wallets...');
  
  const usersWithoutWallets = await prisma.user.findMany({
    where: {
      wallets: {
        none: {},
      },
    },
  });

  for (const user of usersWithoutWallets) {
    await prisma.wallet.create({
      data: {
        userId: user.id,
        walletType: 'mobile_wallet',
        currency: 'USD',
        balance: 0,
      },
    });
    console.log(`  ✅ Created wallet for ${user.email}`);
  }
}

async function validateProfiles() {
  console.log('\n✅ Validating profiles...');
  
  const users = await prisma.user.findMany({
    include: {
      wallets: true,
    },
  });

  const issues: string[] = [];

  for (const user of users) {
    // Check phone number format
    if (user.phoneNumber && !/^\+?[1-9]\d{8,14}$/.test(user.phoneNumber)) {
      issues.push(`  ⚠️  Invalid phone format for ${user.email}: ${user.phoneNumber}`);
    }

    // Check country code
    if (user.country && user.country.length !== 2) {
      issues.push(`  ⚠️  Invalid country code for ${user.email}: ${user.country}`);
    }

    // Check wallet
    if (user.wallets.length === 0) {
      issues.push(`  ⚠️  No wallet for ${user.email}`);
    }
  }

  if (issues.length > 0) {
    console.log('\n  Issues found:');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('  ✅ All profiles valid');
  }
}

async function main() {
  console.log('🚀 Starting auth issues fix...\n');

  try {
    await fixCountryCodes();
    await linkSupabaseUsers();
    await createMissingWallets();
    await validateProfiles();

    console.log('\n✅ Auth issues fix completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during fix:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
