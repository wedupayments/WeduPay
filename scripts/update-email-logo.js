#!/usr/bin/env node

/**
 * Update Logo URL in all Email Templates
 *
 * Usage:
 *   node scripts/update-email-logo.js https://your-domain.com/logo.png
 *
 * Updates the logo URL across all 15 email templates in src/emails/
 */

const fs = require('fs');
const path = require('path');

const newLogoUrl = process.argv[2];

if (!newLogoUrl) {
  console.log('Usage: node scripts/update-email-logo.js <logo-url>');
  console.log('Example: node scripts/update-email-logo.js https://wedu-pay.vercel.app/logo.png');
  process.exit(1);
}

const emailsDir = path.join(__dirname, '..', 'src', 'emails');
const files = fs.readdirSync(emailsDir).filter(f => f.endsWith('.html'));

let updated = 0;

files.forEach(file => {
  const filePath = path.join(emailsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace any existing logo URL pattern
  const patterns = [
    /https?:\/\/[^\s"'<>]+\/logo\.png/g,
    /data:image\/png;base64,[A-Za-z0-9+/=]+/g,
    /\{\{ \.SiteURL \}\}\/logo\.png/g,
  ];

  let changed = false;
  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, newLogoUrl);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
    console.log(`  ✅ ${file}`);
  }
});

console.log(`\nUpdated logo URL in ${updated} email template(s)`);
console.log(`New URL: ${newLogoUrl}`);
