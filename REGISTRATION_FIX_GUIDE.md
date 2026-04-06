# Registration Error Fix Guide

## Problem Summary

Users cannot create accounts. The registration flow fails with a 500 error when calling `/api/auth/create-user`.

### Error Message:
```
Database error: null value in column "id" of relation "users" violates not-null constraint
```

### Error Flow:
1. User submits registration form
2. Supabase Auth user is created successfully ✓
3. `/api/auth/create-user` API endpoint tries to insert user into database
4. Database rejects the insert because `id` column is NULL ✗
5. System tries to clean up by deleting the Supabase user
6. Cleanup fails with 403 Forbidden error ✗

## Root Cause

The database table's UUID default generation is not working when inserting via Supabase client. This happens because:

1. Prisma schema defines `@default(uuid())` but this only works with Prisma Client
2. When using Supabase client directly, the database default isn't triggered
3. The `id` field needs to be explicitly generated in the application code

## Solution Applied

Modified `/api/auth/create-user/route.ts` to explicitly generate UUIDs using Node's `crypto.randomUUID()`:

```typescript
import { randomUUID } from 'crypto';

// Generate UUID for user
const userId = randomUUID();
const { data: newUser, error: createError } = await supabaseAdmin
  .from('users')
  .insert({
    id: userId, // Explicitly set the ID
    supabaseUserId,
    email,
    // ... other fields
  })
```

## Additional Fixes

### 1. Missing Environment Variables in Vercel (Most Likely)

The `SUPABASE_SERVICE_ROLE_KEY` may not be set in your Vercel deployment.

**Fix:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://uuhdjltiwmeitjzqcvlj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjc2MTgsImV4cCI6MjA4OTQwMzYxOH0.emzBLi-P4OnLTtvC13fLi1AF-USpcQ5XvI76lR33_4Y
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgyNzYxOCwiZXhwIjoyMDg5NDAzNjE4fQ.4ZiIK260kPrj-gYn82ksoqxNCsEzh2uIME6LqnANcFs
DATABASE_URL=postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

4. Redeploy your application

### 2. Database Table Missing or Schema Mismatch

The `users` table might not exist or have the wrong schema.

**Fix:**
Run the Prisma migration:

```bash
npx prisma migrate deploy
```

### 3. Row Level Security (RLS) Policies

Supabase RLS policies might be blocking the insert operation.

**Fix:**
1. Go to your Supabase dashboard
2. Navigate to Authentication → Policies
3. For the `users` table, ensure there's a policy that allows the service role to insert:

```sql
-- Allow service role to insert users
CREATE POLICY "Service role can insert users"
ON users
FOR INSERT
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service role to select users
CREATE POLICY "Service role can select users"
ON users
FOR SELECT
TO service_role
USING (true);

-- Allow service role to update users
CREATE POLICY "Service role can update users"
ON users
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

## Code Improvements Made

I've enhanced the `/api/auth/create-user` endpoint with:

1. **Better error logging** - Now logs detailed error information including error codes and hints
2. **Environment variable validation** - Checks if Supabase credentials are set before attempting operations
3. **Graceful wallet creation failure** - Won't fail the entire registration if wallet creation fails
4. **More descriptive error messages** - Returns specific error details to help diagnose issues

## Testing the Fix

### 1. Check Vercel Logs

After redeploying, check the Vercel function logs:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to the Functions tab
4. Look for `/api/auth/create-user` logs

You should see detailed logs like:
```
[CreateUserAPI] REQ-xxx - Creating user profile
[CreateUserAPI] REQ-xxx - Request body: { supabaseUserId: 'xxx', email: 'xxx', hasPhone: true, hasCountry: true }
[CreateUserAPI] REQ-xxx - Normalized data: { email: 'xxx', normalizedPhone: '+263...', normalizedCountry: 'ZW' }
```

### 2. Test Registration

Try registering a new user with:
- Email: test@example.com
- Phone: +263771234567
- Country: Zimbabwe (ZW)
- Password: Test1234

### 3. Check for Orphaned Supabase Users

If users were created in Supabase Auth but not in the database:
1. Go to Supabase Dashboard → Authentication → Users
2. Look for users without corresponding database records
3. Delete them manually or use the admin API

## Quick Verification Commands

### Check if environment variables are set in Vercel:
```bash
vercel env ls
```

### Check database connection:
```bash
npx prisma db pull
```

### View recent migrations:
```bash
npx prisma migrate status
```

## Additional Notes

- The phone number validation accepts international format: `+[country code][number]`
- Country codes must be 2-letter ISO codes (ZW, KE, NG, etc.)
- The system automatically creates a default USD wallet for new users
- Password must be at least 8 characters with at least 1 number

## If Issues Persist

1. Check Supabase project status at https://status.supabase.com/
2. Verify database connection string is correct
3. Ensure Supabase project is not paused
4. Check if there are any rate limits being hit
5. Review Supabase logs in the dashboard

## Contact Support

If none of these fixes work, provide:
- Vercel function logs for `/api/auth/create-user`
- Supabase project logs
- The exact error message shown to users
- Steps to reproduce the issue
