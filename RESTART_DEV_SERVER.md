# How to Restart Dev Server Properly

## The Issue
The Prisma connection pool is exhausted. This happens in development when Next.js hot reload creates multiple Prisma instances.

## The Fix Applied
Changed Prisma to use **DIRECT_URL** (port 5432) instead of pooled connection (port 6543) in development mode.

## How to Restart

### Step 1: Stop the Server
In your terminal where `bun dev` is running:
- Press `Ctrl+C`
- Wait 5-10 seconds for all connections to close

### Step 2: Clear Prisma Cache (Optional but Recommended)
```powershell
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
```

### Step 3: Start the Server
```powershell
bun dev
```

## Why This Works

### Before (Pooled Connection - Port 6543)
- ❌ Limited to 100 connections
- ❌ Hot reload creates multiple instances
- ❌ Pool gets exhausted quickly
- ❌ Connections don't close properly

### After (Direct Connection - Port 5432)
- ✅ No connection limit
- ✅ Each request gets its own connection
- ✅ Connections close immediately
- ✅ Perfect for development

## Verify It's Working

After restarting, you should see:
```
✓ Ready in 2.1s
```

And NO MORE errors like:
```
Can't reach database server at aws-1-us-east-1.pooler.supabase.com:6543
```

## Test the Fix

1. Go to http://localhost:3000/dashboard/customer
2. Navigate around the app
3. Try the funding page
4. Check the terminal - should see no Prisma errors

## If Issues Persist

### Option 1: Manually Set Direct URL
Edit `.env`:
```env
# Comment out the pooled URL
# DATABASE_URL="postgres://...6543/postgres..."

# Use direct URL
DATABASE_URL="postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

### Option 2: Restart Your Computer
Sometimes Windows holds onto connections. A full restart clears everything.

### Option 3: Check Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Check your project status
3. Look at Database → Connection Pooling
4. See if connections are stuck

## Production Note

In production (Vercel), the code automatically uses the pooled connection (port 6543) which is correct for serverless environments.

## Current Configuration

- **Development**: Direct connection (port 5432) - No pool limits
- **Production**: Pooled connection (port 6543) - Optimized for serverless

This gives you the best of both worlds!
