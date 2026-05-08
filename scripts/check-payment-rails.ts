import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({ path: ".env.local", override: true, quiet: true });

type CheckLevel = "pass" | "warn" | "fail";

interface CheckResult {
  level: CheckLevel;
  label: string;
  detail?: string;
}

const root = process.cwd();
const results: CheckResult[] = [];

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function read(relativePath: string) {
  return fs.readFileSync(resolve(relativePath), "utf8");
}

function fileExists(relativePath: string) {
  return fs.existsSync(resolve(relativePath));
}

function add(level: CheckLevel, label: string, detail?: string) {
  results.push({ level, label, detail });
}

function requireFile(relativePath: string, label = relativePath) {
  if (fileExists(relativePath)) {
    add("pass", label, relativePath);
    return true;
  }

  add("fail", label, `Missing ${relativePath}`);
  return false;
}

function requireContent(relativePath: string, needle: string, label: string) {
  if (!fileExists(relativePath)) {
    add("fail", label, `Missing ${relativePath}`);
    return;
  }

  const content = read(relativePath);
  if (content.includes(needle)) {
    add("pass", label);
    return;
  }

  add("fail", label, `Expected ${relativePath} to contain: ${needle}`);
}

function warnMissingEnv(name: string, label: string) {
  if (process.env[name]) {
    add("pass", label, `${name} is set`);
    return;
  }

  add("warn", label, `${name} is not set yet`);
}

function printResult(result: CheckResult) {
  const prefix = result.level === "pass" ? "[PASS]" : result.level === "warn" ? "[WARN]" : "[FAIL]";
  const detail = result.detail ? ` - ${result.detail}` : "";
  console.log(`${prefix} ${result.label}${detail}`);
}

console.log("Payment rail readiness check\n");

requireFile("src/lib/ecocash.ts", "Official EcoCash client");
requireFile("src/app/api/ecocash/route.ts", "EcoCash payment route");
requireFile("src/app/api/ecocash/status/[reference]/route.ts", "EcoCash status route");
requireFile("src/app/api/v1/webhooks/ecocash/route.ts", "EcoCash webhook route");

requireFile("src/lib/pawapay.ts", "PawaPay client");
requireFile("src/app/api/v1/webhooks/pawapay/route.ts", "PawaPay webhook route");

requireContent("src/services/wallets/index.ts", "PAWAPAY = 'pawapay'", "PawaPay wallet type registered");
requireContent("src/services/wallets/unified-wallet-factory.ts", "case WalletType.PAWAPAY", "PawaPay unified adapter registered");
requireContent("src/services/webhook/webhook.processor.ts", "pawapay: pawapayHandler", "PawaPay webhook processor registered");
requireContent("prisma/seed-routing.ts", "name: 'pawapay'", "PawaPay provider seed registered");
requireContent("prisma/seed-routing.ts", "Zimbabwe - EcoCash Primary", "Zimbabwe routes to EcoCash first");
requireContent("src/lib/validation.ts", '"pawapay"', "PawaPay accepted by validation");
requireContent("src/lib/swagger.ts", "PawaPay Webhook", "PawaPay appears in OpenAPI docs");
requireContent("src/app/api/v1/options/route.ts", "/api/v1/webhooks/pawapay", "PawaPay CORS/options route registered");

warnMissingEnv("ECOCASH_API_KEY", "EcoCash API key");
warnMissingEnv("ECOCASH_MERCHANT_CODE", "EcoCash merchant code");
warnMissingEnv("PAWAPAY_API_TOKEN", "PawaPay API token");
warnMissingEnv("PAWAPAY_WEBHOOK_SECRET", "PawaPay webhook secret");

const passes = results.filter((result) => result.level === "pass").length;
const warnings = results.filter((result) => result.level === "warn").length;
const failures = results.filter((result) => result.level === "fail").length;

for (const result of results) {
  printResult(result);
}

console.log(`\nSummary: ${passes} passed, ${warnings} warnings, ${failures} failures`);

if (warnings > 0) {
  console.log("Warnings are expected until sandbox/live credentials are added.");
}

if (failures > 0) {
  process.exit(1);
}

process.exit(0);
