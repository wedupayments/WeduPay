# Deployment Checklist - Registration Fix

## Pre-Deployment

- [ ] Review code changes in `src/app/api/auth/create-user/route.ts`
- [ ] Ensure all new files are committed
- [ ] Run local tests if available

## Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### Required Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  ```
  https://uuhdjltiwmeitjzqcvlj.supabase.co
  ```

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjc2MTgsImV4cCI6MjA4OTQwMzYxOH0.emzBLi-P4OnLTtvC13fLi1AF-USpcQ5XvI76lR33_4Y
  ```

- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRITICAL**
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgyNzYxOCwiZXhwIjoyMDg5NDAzNjE4fQ.4ZiIK260kPrj-gYn82ksoqxNCsEzh2uIME6LqnANcFs
  ```

- [ ] `DATABASE_URL`
  ```
  postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
  ```

- [ ] `DIRECT_URL`
  ```
  postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
  ```

### Environment Scope:
- [ ] Set for: Production, Preview, Development (all three)

## Deployment

- [ ] Push changes to Git
  ```bash
  git add .
  git commit -m "Fix registration 500 error with enhanced logging"
  git push
  ```

- [ ] Wait for Vercel auto-deployment to complete
- [ ] Or manually trigger deployment from Vercel dashboard

## Post-Deployment Verification

### 1. Check Diagnostic Endpoint
- [ ] Visit: `https://wedu-pay.vercel.app/api/debug/registration`
- [ ] Verify all checks show as "healthy"
- [ ] Confirm no recommendations are shown

### 2. Check Function Logs
- [ ] Go to Vercel Dashboard → Deployments → Latest → Functions
- [ ] Look for `/api/auth/create-user` in the list
- [ ] Verify no errors in recent invocations

### 3. Test Registration Flow
- [ ] Go to: `https://wedu-pay.vercel.app/auth/register`
- [ ] Fill in test user details:
  - Email: `test-${timestamp}@example.com`
  - Phone: `+263771234567`
  - Country: Zimbabwe
  - Password: `Test1234`
- [ ] Submit form
- [ ] Verify successful registration
- [ ] Check email for confirmation (if email confirmation is enabled)

### 4. Verify Database
- [ ] Go to Supabase Dashboard → Table Editor → users
- [ ] Confirm new user record was created
- [ ] Check that all fields are populated correctly

### 5. Check for Orphaned Users
- [ ] Run cleanup script locally:
  ```bash
  npx tsx scripts/cleanup-orphaned-users.ts --dry-run
  ```
- [ ] If orphaned users exist, delete them:
  ```bash
  npx tsx scripts/cleanup-orphaned-users.ts --delete
  ```

## Rollback Plan (If Issues Occur)

1. **Immediate Rollback:**
   - Go to Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Investigate:**
   - Check diagnostic endpoint output
   - Review function logs
   - Check Supabase logs

3. **Fix and Redeploy:**
   - Address identified issues
   - Follow this checklist again

## Success Criteria

- [ ] Diagnostic endpoint returns "healthy" status
- [ ] New users can successfully register
- [ ] User records are created in both Supabase Auth and database
- [ ] No 500 errors in function logs
- [ ] No orphaned Supabase Auth users

## Notes

- The `SUPABASE_SERVICE_ROLE_KEY` is the most critical variable
- Without it, the API cannot create database records
- Enhanced logging will help identify any remaining issues
- The diagnostic endpoint is your first stop for troubleshooting

## Support Resources

- `REGISTRATION_FIX_GUIDE.md` - Detailed troubleshooting guide
- `REGISTRATION_FIX_SUMMARY.md` - Quick overview of changes
- Diagnostic endpoint: `/api/debug/registration`
- Cleanup script: `scripts/cleanup-orphaned-users.ts`
