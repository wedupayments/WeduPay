# UUID Generation Fix - APPLIED ✅

## The Problem

Registration was failing with this error:
```
Database error: null value in column "id" of relation "users" violates not-null constraint
```

## Root Cause

When using Supabase client directly (not Prisma), the database's default UUID generation doesn't work. The `@default(uuid())` in Prisma schema only applies when using Prisma Client.

## The Fix

Modified `src/app/api/auth/create-user/route.ts` to explicitly generate UUIDs using Node's `crypto.randomUUID()`.

### Changes Made:

1. Added crypto import
2. Generate UUID for user creation (explicitly set `id` field)
3. Generate UUID for wallet creation (explicitly set `id` field)

## Testing

Test registration at: http://localhost:3000/auth/register

Expected result:
- ✅ Account created successfully
- ✅ User record in database
- ✅ Wallet created for user
- ✅ No 500 errors

## Why This Works

Node's `crypto.randomUUID()` generates a valid UUID v4 that satisfies the database NOT NULL constraint.

## Next Steps

1. Test registration locally
2. If successful, deploy to Vercel
3. Test on production
