-- Verify all merchant dashboard enhancement tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'payment_links',
    'settlements', 
    'webhook_endpoints',
    'webhook_deliveries',
    'export_jobs',
    'analytics_cache'
  )
ORDER BY table_name;
