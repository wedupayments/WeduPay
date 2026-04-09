-- Verify payment_links table structure
SELECT 
    'payment_links' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payment_links'
ORDER BY ordinal_position;

-- Verify settlements table structure
SELECT 
    'settlements' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'settlements'
ORDER BY ordinal_position;

-- Verify webhook_endpoints table structure
SELECT 
    'webhook_endpoints' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'webhook_endpoints'
ORDER BY ordinal_position;

-- Verify webhook_deliveries table structure
SELECT 
    'webhook_deliveries' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'webhook_deliveries'
ORDER BY ordinal_position;

-- Verify export_jobs table structure
SELECT 
    'export_jobs' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'export_jobs'
ORDER BY ordinal_position;

-- Verify analytics_cache table structure
SELECT 
    'analytics_cache' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'analytics_cache'
ORDER BY ordinal_position;

-- Verify indexes on new tables
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'payment_links',
    'settlements',
    'webhook_endpoints',
    'webhook_deliveries',
    'export_jobs',
    'analytics_cache'
  )
ORDER BY tablename, indexname;

-- Verify foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'payment_links',
    'settlements',
    'webhook_endpoints',
    'webhook_deliveries',
    'export_jobs',
    'analytics_cache'
  )
ORDER BY tc.table_name;
