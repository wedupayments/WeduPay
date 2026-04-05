#!/usr/bin/env node

/**
 * Update Logo URL and Copyright Year in all Email Templates
 *
 * Usage:
 *   node scripts/update-email-logo.js [options]
 *
 * Options:
 *   --logo <url>     Update logo URL across all templates
 *   --year <year>    Update copyright year across all templates
 *
 * Examples:
 *   node scripts/update-email-logo.js --logo https://wedu-pay.com/logo.png
 *   node scripts/update-email-logo.js --year 2027
 *   node scripts/update-email-logo.js --logo https://wedu-pay.com/logo.png --year 2027
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const newLogoUrl = args[args.indexOf('--logo') + 1];
const newYear = args[args.indexOf('--year') + 1];

if (!newLogoUrl && !newYear) {
  console.log('Usage: node scripts/update-email-logo.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --logo <url>     Update logo URL across all templates');
  console.log('  --year <year>    Update copyright year across all templates');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/update-email-logo.js --logo https://wedu-pay.com/logo.png');
  console.log('  node scripts/update-email-logo.js --year 2027');
  console.log('  node scripts/update-email-logo.js --logo https://wedu-pay.com/logo.png --year 2027');
  process.exit(1);
}

const emailsDir = path.join(__dirname, '..', 'src', 'emails');
const files = fs.readdirSync(emailsDir).filter(f => f.endsWith('.html'));

let logoUpdated = 0;
let yearUpdated = 0;

files.forEach(file => {
  const filePath = path.join(emailsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (newLogoUrl) {
    const patterns = [
      /https?:\/\/[^\s"'<>]+\/logo\.png/g,
      /data:image\/png;base64,[A-Za-z0-9+/=]+/g,
      /\{\{ \.SiteURL \}\}\/logo\.png/g,
    ];
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, newLogoUrl);
        changed = true;
      }
    });
    if (changed) logoUpdated++;
  }

  if (newYear) {
    const yearPattern = /© \d{4} WeduPay/g;
    if (yearPattern.test(content)) {
      content = content.replace(yearPattern, `© ${newYear} WeduPay`);
      changed = true;
      yearUpdated++;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

if (newLogoUrl) console.log(`\n✅ Logo URL updated in ${logoUpdated} template(s)`);
if (newYear) console.log(`✅ Copyright year updated in ${yearUpdated} template(s)`);
if (newLogoUrl) console.log(`   New URL: ${newLogoUrl}`);
if (newYear) console.log(`   New year: ${newYear}`);
