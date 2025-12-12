-- Fix Specific Supabase Security Advisor Warnings
-- Run this script in your Supabase SQL Editor

-- ============================================
-- WARNING 1: Tables without Row Level Security
-- ============================================

-- List all public tables without RLS enabled
SELECT
    schemaname,
    tablename,
    'ALTER TABLE ' || schemaname || '.' || tablename || ' ENABLE ROW LEVEL SECURITY;' as fix_command
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys');

-- Enable RLS on all public tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND rowsecurity = false
        AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        RAISE NOTICE 'Enabled RLS on %.%', r.schemaname, r.tablename;
    END LOOP;
END $$;

-- ============================================
-- WARNING 2: Tables with RLS but no policies
-- ============================================

-- Find tables with RLS enabled but no policies
SELECT DISTINCT
    t.schemaname,
    t.tablename,
    'Table has RLS enabled but no policies defined' as warning
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname
    AND p.tablename = t.tablename
);

-- Create basic authenticated-only policies for tables without policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT DISTINCT t.schemaname, t.tablename
        FROM pg_tables t
        WHERE t.schemaname = 'public'
        AND t.rowsecurity = true
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies p
            WHERE p.schemaname = t.schemaname
            AND p.tablename = t.tablename
        )
    LOOP
        -- Create a basic policy that requires authentication
        EXECUTE format(
            'CREATE POLICY "Authenticated users only" ON %I.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
            r.schemaname, r.tablename
        );
        RAISE NOTICE 'Created basic policy for %.%', r.schemaname, r.tablename;
        RAISE NOTICE 'IMPORTANT: Review and update policy for %.% based on your business logic', r.schemaname, r.tablename;
    END LOOP;
END $$;

-- ============================================
-- WARNING 3: Functions accessible by anon role
-- ============================================

-- Find functions that anon role can execute
SELECT
    n.nspname as schema,
    p.proname as function_name,
    'REVOKE EXECUTE ON FUNCTION ' || n.nspname || '.' || p.proname ||
    '(' || pg_get_function_identity_arguments(p.oid) || ') FROM anon;' as fix_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND has_function_privilege('anon', p.oid, 'EXECUTE')
AND p.proname NOT IN (
    -- Keep these functions accessible to anon if they exist
    'handle_new_user',  -- Common auth trigger
    'get_public_data'   -- Public data access
);

-- Revoke execute from anon on all functions, then grant back selectively
DO $$
BEGIN
    -- Revoke all function execution from anon
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

    -- Grant back specific functions that should be public
    -- Add your public functions here
    -- Example: GRANT EXECUTE ON FUNCTION public.get_public_posts() TO anon;

    RAISE NOTICE 'Revoked function execution from anon role';
END $$;

-- ============================================
-- WARNING 4: Storage buckets without policies
-- ============================================

-- Check storage buckets configuration
SELECT
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    CASE
        WHEN public THEN 'WARNING: Bucket is publicly accessible'
        ELSE 'OK: Bucket is private'
    END as status
FROM storage.buckets;

-- Ensure storage objects table has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create default storage policies if they don't exist
DO $$
BEGIN
    -- Check if any storage policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'objects'
        AND schemaname = 'storage'
    ) THEN
        -- Create basic authenticated-only policy for storage
        CREATE POLICY "Authenticated users can upload" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (bucket_id IN (SELECT id FROM storage.buckets WHERE public = false));

        CREATE POLICY "Users can view own uploads" ON storage.objects
            FOR SELECT TO authenticated
            USING (auth.uid() = owner);

        CREATE POLICY "Users can update own uploads" ON storage.objects
            FOR UPDATE TO authenticated
            USING (auth.uid() = owner)
            WITH CHECK (auth.uid() = owner);

        CREATE POLICY "Users can delete own uploads" ON storage.objects
            FOR DELETE TO authenticated
            USING (auth.uid() = owner);

        RAISE NOTICE 'Created default storage policies';
    END IF;
END $$;

-- ============================================
-- WARNING 5: Exposed Postgres extensions
-- ============================================

-- List potentially dangerous extensions
SELECT
    extname,
    extnamespace::regnamespace as schema,
    CASE
        WHEN extname IN ('pgcrypto', 'uuid-ossp', 'pg_stat_statements') THEN 'OK'
        WHEN extname IN ('dblink', 'file_fdw', 'postgres_fdw') THEN 'WARNING: Can access external resources'
        WHEN extname = 'adminpack' THEN 'WARNING: Administrative functions exposed'
        ELSE 'Review needed'
    END as security_status
FROM pg_extension
WHERE extname NOT IN ('plpgsql');

-- ============================================
-- WARNING 6: Webhooks and Edge Functions Security
-- ============================================

-- Check for database webhooks (if using pg_net)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        -- List all webhooks
        RAISE NOTICE 'pg_net extension found - review webhook configurations';

        -- Ensure webhook table has proper security
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'http_request' AND table_schema = 'net') THEN
            ALTER TABLE net.http_request ENABLE ROW LEVEL SECURITY;

            -- Only service role should manage webhooks
            DROP POLICY IF EXISTS "Only service role can manage webhooks" ON net.http_request;
            CREATE POLICY "Only service role can manage webhooks" ON net.http_request
                FOR ALL USING (auth.role() = 'service_role');
        END IF;
    END IF;
END $$;

-- ============================================
-- SUGGESTIONS 1: Performance Indexes
-- ============================================

-- Find foreign keys without indexes
SELECT
    'CREATE INDEX idx_' || tc.table_name || '_' || kcu.column_name ||
    ' ON ' || tc.table_schema || '.' || tc.table_name || '(' || kcu.column_name || ');' as suggested_index
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = tc.table_schema
    AND tablename = tc.table_name
    AND indexdef LIKE '%' || kcu.column_name || '%'
);

-- ============================================
-- SUGGESTIONS 2: API Security Headers
-- ============================================

-- Note: These need to be set in your application code or Edge Functions
SELECT 'Configure CORS properly in your Supabase dashboard' as suggestion
UNION ALL
SELECT 'Enable rate limiting for API endpoints'
UNION ALL
SELECT 'Use API keys with restricted permissions'
UNION ALL
SELECT 'Implement request signing for sensitive operations'
UNION ALL
SELECT 'Set up monitoring and alerting for suspicious activity';

-- ============================================
-- FINAL SECURITY REPORT
-- ============================================

WITH security_summary AS (
    SELECT
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) as tables_without_rls,
        (SELECT COUNT(DISTINCT tablename) FROM pg_tables t
         WHERE schemaname = 'public' AND rowsecurity = true
         AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename)) as tables_without_policies,
        (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
         WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE')) as anon_accessible_functions,
        (SELECT COUNT(*) FROM storage.buckets WHERE public = true) as public_buckets
)
SELECT
    CASE
        WHEN tables_without_rls = 0
        AND tables_without_policies = 0
        AND anon_accessible_functions = 0
        AND public_buckets = 0
        THEN '✅ All security checks passed!'
        ELSE '⚠️ Security issues found - review above warnings'
    END as status,
    tables_without_rls || ' tables without RLS' as rls_status,
    tables_without_policies || ' tables without policies' as policy_status,
    anon_accessible_functions || ' functions accessible by anon' as function_status,
    public_buckets || ' public storage buckets' as storage_status
FROM security_summary;

-- Run this to see detailed security status
SELECT * FROM check_security_status() WHERE status != 'PASS';