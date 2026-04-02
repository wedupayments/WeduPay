/**
 * Vercel Environment Setup Script
 * 
 * Automatically adds all required environment variables to Vercel
 * 
 * Usage:
 *   node vercel-env-setup.js
 * 
 * Prerequisites:
 *   - Vercel CLI installed (npm i -g vercel)
 *   - Logged in to Vercel (vercel login)
 *   - Project linked (vercel link)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      envVars[key.trim()] = value;
    }
  }
});

// Required variables for Vercel
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
];

// Optional variables
const optionalVars = [
  'SUPABASE_JWT_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_VERCEL_ANALYTICS_ID',
  'EMAIL_PROVIDER',
  'SMS_PROVIDER',
];

console.log('🚀 Vercel Environment Setup\n');
console.log('='.repeat(50));

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
  console.log('✅ Vercel CLI detected\n');
} catch (error) {
  console.error('❌ Vercel CLI not found');
  console.log('\nInstall with: npm i -g vercel\n');
  process.exit(1);
}

// Check if project is linked
try {
  const projectId = execSync('vercel ls --json', { encoding: 'utf8' });
  console.log('✅ Project linked\n');
} catch (error) {
  console.log('⚠️  Project not linked');
  console.log('\nLinking project...\n');
  try {
    execSync('vercel link', { stdio: 'inherit' });
    console.log('✅ Project linked\n');
  } catch (linkError) {
    console.error('❌ Failed to link project');
    process.exit(1);
  }
}

console.log('='.repeat(50));
console.log('\n📦 Adding Environment Variables\n');

let added = 0;
let skipped = 0;
let failed = 0;

// Add required variables
console.log('🔴 Required Variables:');
for (const key of requiredVars) {
  const value = envVars[key];
  
  if (!value) {
    console.log(`  ⚠️  ${key} - Missing in .env, skipping...`);
    skipped++;
    continue;
  }
  
  try {
    console.log(`  ⏳ Adding ${key}...`);
    execSync(`vercel env add ${key} "${value}"`, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      input: '\n', // Select all environments
    });
    console.log(`  ✅ ${key} - Added`);
    added++;
  } catch (error) {
    console.log(`  ⚠️  ${key} - May already exist`);
    skipped++;
  }
}

// Add optional variables
console.log('\n🟢 Optional Variables:');
for (const key of optionalVars) {
  const value = envVars[key];
  
  if (!value || value === '') {
    console.log(`  ⚪ ${key} - Empty, skipping...`);
    continue;
  }
  
  try {
    console.log(`  ⏳ Adding ${key}...`);
    execSync(`vercel env add ${key} "${value}"`, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      input: '\n',
    });
    console.log(`  ✅ ${key} - Added`);
    added++;
  } catch (error) {
    console.log(`  ⚠️  ${key} - May already exist`);
    skipped++;
  }
}

console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:');
console.log(`  ✅ Added: ${added}`);
console.log(`  ⚠️  Skipped: ${skipped}`);
console.log(`  ❌ Failed: ${failed}`);

console.log('\n🎉 Environment setup complete!\n');
console.log('Next steps:');
console.log('  1. Go to Vercel Dashboard → Your Project');
console.log('  2. Click Deployments');
console.log('  3. Redeploy the latest version\n');
