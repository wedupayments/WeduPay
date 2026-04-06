# Quick Commands - Registration Fix

## Diagnostic Commands

### Check registration health
```bash
curl https://wedu-pay.vercel.app/api/debug/registration
```

### Check for orphaned users (preview only)
```bash
npx tsx scripts/cleanup-orphaned-users.ts --dry-run
```

### Delete orphaned users
```bash
npx tsx scripts/cleanup-orphaned-users.ts --delete
```

## Vercel Commands

### List environment variables
```bash
vercel env ls
```

### Add environment variable
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Pull environment variables to local
```bash
vercel env pull .env.local
```

### View deployment logs
```bash
vercel logs
```

### Trigger new deployment
```bash
vercel --prod
```

## Database Commands

### Check migration status
```bash
npx prisma migrate status
```

### Apply migrations
```bash
npx prisma migrate deploy
```

### View database schema
```bash
npx prisma db pull
```

### Open Prisma Studio (database GUI)
```bash
npx prisma studio
```

## Git Commands

### Commit and push changes
```bash
git add .
git commit -m "Fix registration 500 error with enhanced logging"
git push
```

### View recent commits
```bash
git log --oneline -5
```

## Testing Commands

### Test registration locally
```bash
# Start dev server
npm run dev

# In another terminal, test the API
curl -X POST http://localhost:3000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "supabaseUserId": "test-123",
    "email": "test@example.com",
    "phoneNumber": "+263771234567",
    "country": "ZW"
  }'
```

### Check local diagnostic endpoint
```bash
curl http://localhost:3000/api/debug/registration | jq
```

## Supabase Commands (via CLI)

### Login to Supabase
```bash
npx supabase login
```

### Link to project
```bash
npx supabase link --project-ref uuhdjltiwmeitjzqcvlj
```

### View database migrations
```bash
npx supabase db diff
```

## Useful One-Liners

### Count users in database
```bash
npx prisma studio
# Then navigate to users table
```

### Check if service role key is set in Vercel
```bash
vercel env ls | grep SUPABASE_SERVICE_ROLE_KEY
```

### View last 50 lines of Vercel logs
```bash
vercel logs --follow
```

### Test if Supabase is reachable
```bash
curl https://uuhdjltiwmeitjzqcvlj.supabase.co/rest/v1/
```

## Emergency Commands

### Rollback to previous deployment
```bash
# Go to Vercel dashboard and promote previous deployment
# Or use CLI:
vercel rollback
```

### Clear Next.js cache
```bash
rm -rf .next
npm run build
```

### Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## Monitoring

### Watch Vercel logs in real-time
```bash
vercel logs --follow
```

### Monitor registration attempts
```bash
# In Vercel dashboard:
# Deployments → Latest → Functions → /api/auth/create-user
```

## Notes

- Add `| jq` to curl commands for pretty JSON output
- Use `--dry-run` flags when available to preview changes
- Always check diagnostic endpoint first when troubleshooting
- Keep Vercel CLI updated: `npm i -g vercel@latest`
