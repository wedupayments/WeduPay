/**
 * Cleanup Orphaned Supabase Users
 * 
 * This script finds and optionally deletes Supabase Auth users
 * that don't have corresponding records in the database.
 * 
 * Usage:
 *   npx tsx scripts/cleanup-orphaned-users.ts --dry-run  # Preview only
 *   npx tsx scripts/cleanup-orphaned-users.ts --delete   # Actually delete
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--delete');

async function main() {
  console.log('🔍 Checking for orphaned Supabase users...\n');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'DELETE MODE'}\n`);

  try {
    // Get all Supabase Auth users
    console.log('1. Fetching Supabase Auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Failed to fetch auth users:', authError.message);
      process.exit(1);
    }

    console.log(`   Found ${authUsers.users.length} auth users\n`);

    // Get all database users
    console.log('2. Fetching database users...');
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('supabaseUserId, email');

    if (dbError) {
      console.error('❌ Failed to fetch database users:', dbError.message);
      process.exit(1);
    }

    console.log(`   Found ${dbUsers?.length || 0} database users\n`);

    // Find orphaned users
    const dbUserIds = new Set(dbUsers?.map(u => u.supabaseUserId).filter(Boolean) || []);
    const orphanedUsers = authUsers.users.filter(authUser => !dbUserIds.has(authUser.id));

    console.log('3. Analysis:');
    console.log(`   Total auth users: ${authUsers.users.length}`);
    console.log(`   Total database users: ${dbUsers?.length || 0}`);
    console.log(`   Orphaned users: ${orphanedUsers.length}\n`);

    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned users found!');
      return;
    }

    // Display orphaned users
    console.log('4. Orphaned Users:');
    orphanedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || 'No email'} (ID: ${user.id})`);
      console.log(`      Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`      Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    });
    console.log('');

    // Delete if not dry run
    if (!isDryRun) {
      console.log('5. Deleting orphaned users...');
      let successCount = 0;
      let failCount = 0;

      for (const user of orphanedUsers) {
        try {
          const { error } = await supabase.auth.admin.deleteUser(user.id);
          if (error) {
            console.error(`   ✗ Failed to delete ${user.email}: ${error.message}`);
            failCount++;
          } else {
            console.log(`   ✓ Deleted ${user.email || user.id}`);
            successCount++;
          }
        } catch (error) {
          console.error(`   ✗ Error deleting ${user.email}:`, error);
          failCount++;
        }
      }

      console.log('');
      console.log('Summary:');
      console.log(`   Successfully deleted: ${successCount}`);
      console.log(`   Failed to delete: ${failCount}`);
    } else {
      console.log('5. Dry run mode - no users were deleted');
      console.log('   Run with --delete flag to actually delete these users');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
