# 🚀 WeduPay - Vercel Deployment Guide

## ⚡ Quick Fix for "supabaseKey is required" Error

Your Vercel deployment is missing environment variables. Here's how to fix it:

---

## Method 1: Vercel Dashboard (Easiest) ⭐

### Step 1: Open Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your **WeduPay** project

### Step 2: Add Environment Variables
1. Click **Settings** tab
2. Click **Environment Variables** in the left sidebar
3. Click **Add New** button

### Step 3: Copy These Variables

Copy each variable below and add it to Vercel:

```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://uuhdjltiwmeitjzqcvlj.supabase.co
Environments: ✓ Production  ✓ Preview  ✓ Development
```

```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjc2MTgsImV4cCI6MjA4OTQwMzYxOH0.emzBLi-P4OnLTtvC13fLi1AF-USpcQ5XvI76lR33_4Y
Environments: ✓ Production  ✓ Preview  ✓ Development
```

```
Name:  SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgyNzYxOCwiZXhwIjoyMDg5NDAzNjE4fQ.4ZiIK260kPrj-gYn82ksoqxNCsEzh2uIME6LqnANcFs
Environments: ✓ Production  ✓ Preview  ✓ Development
```

```
Name:  DATABASE_URL
Value: postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
Environments: ✓ Production  ✓ Preview  ✓ Development
```

```
Name:  DIRECT_URL
Value: postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
Environments: ✓ Production  ✓ Preview  ✓ Development
```

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋮** menu
4. Click **Redeploy**

---

## Method 2: Vercel CLI (Advanced)

### Prerequisites
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel@latest

# Login to Vercel
vercel login

# Link your project
cd c:\Work\WeduPay
vercel link
```

### Add Environment Variables
Run these commands one by one:

```bash
# Required variables
vercel env add NEXT_PUBLIC_SUPABASE_URL "https://uuhdjltiwmeitjzqcvlj.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
vercel env add SUPABASE_SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
vercel env add DATABASE_URL "postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@..."
vercel env add DIRECT_URL "postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@..."

# Optional variables
vercel env add SUPABASE_JWT_SECRET "yJShGAwdkXF93eif2GwkjokUibbEMYDh4..."
vercel env add NEXT_PUBLIC_APP_URL "https://your-app.vercel.app"
```

When prompted for environments, press **Enter** to select all (Production, Preview, Development).

### Redeploy
```bash
vercel --prod
```

---

## ✅ Verify Deployment

After redeploying, visit your Vercel app:
- **URL:** https://your-app.vercel.app
- **Dashboard:** https://your-app.vercel.app/dashboard/admin

The error `supabaseKey is required` should be gone!

---

## 📋 All Environment Variables

### Required (Must Add)
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uuhdjltiwmeitjzqcvlj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(see above)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(see above)* |
| `DATABASE_URL` | *(see above)* |
| `DIRECT_URL` | *(see above)* |

### Optional (Add as needed)
| Variable | Purpose |
|----------|---------|
| `SUPABASE_JWT_SECRET` | JWT token signing |
| `NEXT_PUBLIC_GA_ID` | Google Analytics |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics |
| `MPESA_CONSUMER_KEY` | M-Pesa payments |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave payments |

---

## 🔧 Troubleshooting

### Error: "supabaseKey is required"
**Cause:** Environment variables not set in Vercel  
**Fix:** Add the 5 required variables above and redeploy

### Error: "Database connection failed"
**Cause:** DATABASE_URL incorrect or Supabase not accessible  
**Fix:** Verify DATABASE_URL matches your Supabase project

### Error: "Build failed"
**Cause:** Missing dependencies or build errors  
**Fix:** Check build logs in Vercel dashboard

---

## 📞 Need Help?

1. Check Vercel deployment logs: https://vercel.com/dashboard
2. Check Supabase project: https://supabase.com/dashboard
3. Review environment variables in Vercel Settings

---

**Last Updated:** 2026-04-02  
**Status:** ✅ Ready for deployment
