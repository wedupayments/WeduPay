# Registration Issue - Fix Summary

## Problem
Users cannot create accounts. Registration fails with a 500 error at the `/api/auth/create-user` endpoint.

## What I Fixed

### 1. Enhanced Error Logging (`src/app/api/auth/create-user/route.ts`)
- Added environment variable validation before attempting operations
- Enhanced database error logging with detailed error codes, messages, and hints
- Made wallet creation non-blocking (won't fail registration if wallet creation fails)
- Return specific error messages instead of generic 500 errors

### 2. Created Diagnostic Tools

#### Debug Endpoint (`src/app/api/debug/registration/route.ts`)
Visit `https://wedu-pay.vercel.app/api/debug/registration` to check:
- Environment variables status
- Supabase connection
- Database connection
- Users table existence
- Automatic recommendations for fixes

#### Cleanup Script (`scripts/cleanup-orphaned-users.ts`)
Finds and removes Supabase Auth users without database records:
```bash
# Preview orphaned users
npx tsx scripts/cleanup-orphaned-users.ts --dry-run

# Delete orphaned users
npx tsx scripts/cleanup-orphaned-users.ts --delete
```

### 3. Comprehensive Fix Guide (`REGISTRATION_FIX_GUIDE.md`)
Step-by-step instructions for:
- Setting up Vercel environment variables
- Running database migrations
- Configuring Supabase RLS policies
- Testing the fix
- Troubleshooting

## Next Steps

### Immediate Actions:

1. **Check Vercel Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
   - Redeploy if you add/update variables

2. **Run Diagnostic Endpoint**
   ```
   Visit: https://wedu-pay.vercel.app/api/debug/registration
   ```
   This will tell you exactly what's wrong

3. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Deployments → Latest → Functions
   - Look for `/api/auth/create-user` logs
   - You should now see detailed error messages

4. **Clean Up Orphaned Users** (if any)
   ```bash
   npx tsx scripts/cleanup-orphaned-users.ts --dry-run
   ```

### Most Likely Fix:

The issue is probably that `SUPABASE_SERVICE_ROLE_KEY` is not set in Vercel. Add it:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgyNzYxOCwiZXhwIjoyMDg5NDAzNjE4fQ.4ZiIK260kPrj-gYn82ksoqxNCsEzh2uIME6LqnANcFs
```

Then redeploy.

## Testing

After deploying the fixes, test registration with:
- Email: test@example.com
- Phone: +263771234567
- Country: Zimbabwe
- Password: Test1234

## Files Modified/Created

### Modified:
- `src/app/api/auth/create-user/route.ts` - Enhanced error handling and logging

### Created:
- `REGISTRATION_FIX_GUIDE.md` - Comprehensive troubleshooting guide
- `REGISTRATION_FIX_SUMMARY.md` - This file
- `src/app/api/debug/registration/route.ts` - Diagnostic endpoint
- `scripts/cleanup-orphaned-users.ts` - Cleanup utility

## Support

If issues persist after following the guide:
1. Check the diagnostic endpoint output
2. Review Vercel function logs
3. Check Supabase dashboard logs
4. Verify database migrations are applied
