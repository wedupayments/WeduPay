# ============================================
# WeduPay - Vercel Environment Setup
# ============================================
# 
# Copy and paste these commands one by one into your terminal
# Each command will prompt you to select environments (press Enter for all)
# ============================================

echo "🔴 REQUIRED - Add these first:"

vercel env add NEXT_PUBLIC_SUPABASE_URL "https://uuhdjltiwmeitjzqcvlj.supabase.co"

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjc2MTgsImV4cCI6MjA4OTQwMzYxOH0.emzBLi-P4OnLTtvC13fLi1AF-USpcQ5XvI76lR33_4Y"

vercel env add SUPABASE_SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGRqbHRpd21laXRqenFjdmxqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgyNzYxOCwiZXhwIjoyMDg5NDAzNjE4fQ.4ZiIK260kPrj-gYn82ksoqxNCsEzh2uIME6LqnANcFs"

vercel env add DATABASE_URL "postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

vercel env add DIRECT_URL "postgres://postgres.uuhdjltiwmeitjzqcvlj:dKrgKvsoGyFbJ3JA@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

echo ""
echo "🟢 OPTIONAL - Add these if needed:"

vercel env add SUPABASE_JWT_SECRET "yJShGAwdkXF93eif2GwkjokUibbEMYDh4WCPUT7e6UzJIJj47BxUmmBMkdw+8jFwX6UZHHsUr1h732m9VOhLfw=="

vercel env add NEXT_PUBLIC_APP_URL "https://your-app.vercel.app"

vercel env add NEXT_PUBLIC_GA_ID ""

vercel env add NEXT_PUBLIC_VERCEL_ANALYTICS_ID ""

echo ""
echo "✅ Done! Now redeploy:"
echo "   vercel --prod"
