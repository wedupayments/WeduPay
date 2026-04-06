#!/usr/bin/env node

/**
 * Vercel Environment Variables Sync Script
 *
 * This script reads environment variables from .env.local and syncs them to Vercel.
 *
 * Usage:
 *   node sync-env-to-vercel.js
 *
 * Requirements:
 *   - Vercel CLI installed: npm install -g vercel
 *   - Logged in to Vercel: vercel login
 *   - Project linked: vercel link
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// List of environment variable keys to sync
const ENV_VAR_KEYS = [
  // Database
  "DATABASE_URL",
  "DIRECT_URL",

  // Supabase
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",

  // Application
  "NEXT_PUBLIC_APP_URL",
  "NODE_ENV",

  // Additional Supabase variables
  "SUPABASE_SECRET_KEY",
  "POSTGRES_DATABASE",
  "POSTGRES_HOST",
  "POSTGRES_PASSWORD",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_USER",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

// Build ENV_VARS from process.env
const ENV_VARS = {};
for (const key of ENV_VAR_KEYS) {
  if (process.env[key]) {
    ENV_VARS[key] = process.env[key];
  }
}

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command) {
  try {
    return execSync(command, { stdio: "pipe" }).toString().trim();
  } catch (error) {
    return null;
  }
}

function checkVercelCLI() {
  log("Checking Vercel CLI...", "blue");
  const version = runCommand("vercel --version");

  if (!version) {
    log(
      "❌ Vercel CLI not found. Install it with: npm install -g vercel",
      "red",
    );
    return false;
  }

  log(`✓ Vercel CLI version ${version}`, "green");
  return true;
}

function checkVercelLogin() {
  log("Checking Vercel login status...", "blue");
  const whoami = runCommand("vercel whoami");

  if (!whoami || whoami.includes("not logged in")) {
    log("❌ Not logged in to Vercel. Run: vercel login", "red");
    return false;
  }

  log(`✓ Logged in as ${whoami}`, "green");
  return true;
}

function checkVercelLink() {
  log("Checking Vercel project link...", "blue");

  const vercelJsonPath = path.join(__dirname, ".vercel", "project.json");
  if (!fs.existsSync(vercelJsonPath)) {
    log("❌ Project not linked. Run: vercel link", "red");
    return false;
  }

  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, "utf8"));
  log(`✓ Linked to project: ${vercelJson.projectId}`, "green");
  return true;
}

function syncEnvVar(key, value) {
  log(`Syncing ${key}...`, "blue");

  // Use vercel env add command
  // Format: vercel env add KEY VALUE [target]
  const command = `vercel env add ${key} "${value}" --environment production --environment preview --environment development`;

  try {
    execSync(command, { stdio: "ignore" });
    log(`  ✓ ${key}`, "green");
    return true;
  } catch (error) {
    // Check if variable already exists
    if (error.message.includes("already exists") || error.status === 0) {
      log(`  ✓ ${key} (already exists)`, "yellow");
      return true;
    }
    log(`  ❌ ${key} failed`, "red");
    return false;
  }
}

async function main() {
  log("\n========================================", "blue");
  log("Vercel Environment Variables Sync", "blue");
  log("========================================\n", "blue");

  // Pre-flight checks
  if (!checkVercelCLI()) {
    process.exit(1);
  }

  if (!checkVercelLogin()) {
    process.exit(1);
  }

  if (!checkVercelLink()) {
    log("\nLinking to Vercel project...", "blue");
    try {
      execSync("vercel link", { stdio: "inherit" });
    } catch (error) {
      process.exit(1);
    }
  }

  log("\n----------------------------------------\n", "blue");

  // Sync environment variables
  let successCount = 0;
  let failCount = 0;

  for (const [key, value] of Object.entries(ENV_VARS)) {
    const success = await syncEnvVar(key, value);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  log("\n----------------------------------------", "blue");
  log(`\nSync complete!`, "blue");
  log(`✓ Successful: ${successCount}`, "green");
  log(`❌ Failed: ${failCount}`, "red");

  if (successCount > 0) {
    log(
      "\n⚠️  IMPORTANT: Redeploy your project for changes to take effect",
      "yellow",
    );
    log("   Run: vercel --prod\n", "yellow");
  }
}

main().catch((error) => {
  log(`Error: ${error.message}`, "red");
  process.exit(1);
});
