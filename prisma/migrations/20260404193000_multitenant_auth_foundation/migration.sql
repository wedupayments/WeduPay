CREATE TABLE IF NOT EXISTS "tenants" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");

CREATE TABLE IF NOT EXISTS "tenant_memberships" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_memberships_tenantId_userId_key" ON "tenant_memberships"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "tenant_memberships_userId_idx" ON "tenant_memberships"("userId");
CREATE INDEX IF NOT EXISTS "tenant_memberships_tenantId_idx" ON "tenant_memberships"("tenantId");

CREATE TABLE IF NOT EXISTS "tenant_domains" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_domains_domain_key" ON "tenant_domains"("domain");
CREATE INDEX IF NOT EXISTS "tenant_domains_tenantId_idx" ON "tenant_domains"("tenantId");

ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "payment_references" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "virtual_cards" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "routed_transactions" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "p2p_transfers" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "transfer_recipients" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "compliance_checks" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS "wallets_tenantId_idx" ON "wallets"("tenantId");
CREATE INDEX IF NOT EXISTS "transactions_tenantId_idx" ON "transactions"("tenantId");
CREATE INDEX IF NOT EXISTS "payment_references_tenantId_idx" ON "payment_references"("tenantId");
CREATE INDEX IF NOT EXISTS "api_keys_tenantId_idx" ON "api_keys"("tenantId");
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "virtual_cards_tenantId_idx" ON "virtual_cards"("tenantId");
CREATE INDEX IF NOT EXISTS "routed_transactions_tenantId_idx" ON "routed_transactions"("tenantId");
CREATE INDEX IF NOT EXISTS "p2p_transfers_tenantId_idx" ON "p2p_transfers"("tenantId");
CREATE INDEX IF NOT EXISTS "transfer_recipients_tenantId_idx" ON "transfer_recipients"("tenantId");
CREATE INDEX IF NOT EXISTS "compliance_checks_tenantId_idx" ON "compliance_checks"("tenantId");

ALTER TABLE "tenant_memberships"
  ADD CONSTRAINT "tenant_memberships_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_memberships"
  ADD CONSTRAINT "tenant_memberships_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_domains"
  ADD CONSTRAINT "tenant_domains_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
