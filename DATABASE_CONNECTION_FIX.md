# Database Connection Issue - Fix Guide

## Problem

Prisma can't connect to the database:
```
Can't reach database server at `aws-1-us-east-1.pooler.supabase.com:6543`
Error code: P1001
```

## Root Cause

This is typically caused by:
1. Prisma client connection pool exhaustion
2. Stale Prisma client in development mode
3. File locks on Prisma query engine
4. Too many concurrent connections

## Quick Fix

### Option 1: Restart Dev Server (Recommended)

1. Stop the dev server (Ctrl+C in terminal)
2. Wait 5 seconds
3. Start it again:
   ```bash
   npm run dev
   ```

### Option 2: Clear Prisma Client

1. Stop the dev server
2. Delete the Prisma client:
   ```bash
   Remove-Item -Recurse -Force node_modules\.prisma
   ```
3. Regenerate:
   ```bash
   npx prisma generate
   ```
4. Restart dev server

### Option 3: Use Direct Connection

Temporarily modify `src/lib/prisma.ts` to use direct connection instead of pooled:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});
```

## Why This Happens in Development

Next.js hot reload can create multiple Prisma client instances, exhausting the connection pool. The pooled connection (port 6543) has a limit of 100 connections.

## Long-term Solution

Add this to `src/lib/prisma.ts` to prevent multiple instances:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## Verify Connection

After restarting, test the connection:

```bash
npx prisma db pull
```

Should show: "Introspected X models and wrote them into prisma\schema.prisma"

## Current Status

- ✅ Network connectivity to database: Working
- ✅ Database server is online: Working  
- ❌ Prisma client connection: Needs restart

## Next Steps

1. Stop your dev server
2. Wait 5 seconds for connections to close
3. Start dev server again: `npm run dev`
4. Try registration again

The registration fix (UUID generation) is still in place and will work once the connection is restored.
