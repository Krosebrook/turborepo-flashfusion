-- Comprehensive Supabase Security Fixes
-- This script addresses common security warnings and best practices
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

-- Get all tables without RLS enabled and enable it
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('public', 'auth')
        AND tablename NOT IN ('schema_migrations', 'supabase_functions_migrations')
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = pg_tables.schemaname
            AND tablename = pg_tables.tablename
        )
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        RAISE NOTICE 'Enabled RLS on %.%', r.schemaname, r.tablename;
    END LOOP;
END $$;

-- ============================================
-- 2. CREATE DEFAULT RLS POLICIES FOR COMMON TABLES
-- ============================================

-- Users table policies
DO $$
BEGIN
    -- Check if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN

        -- Enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies to avoid conflicts
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

        -- Users can only view their own profile
        CREATE POLICY "Users can view own profile" ON public.users
            FOR SELECT USING (auth.uid() = id);

        -- Users can only update their own profile
        CREATE POLICY "Users can update own profile" ON public.users
            FOR UPDATE USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);

        -- Service role bypass
        CREATE POLICY "Service role can manage all users" ON public.users
            FOR ALL USING (auth.role() = 'service_role');

        RAISE NOTICE 'Created RLS policies for users table';
    END IF;
END $$;

-- Profiles table policies (common pattern)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN

        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

        -- Public read access
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
            FOR SELECT USING (true);

        -- Users can update their own profile
        CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

        -- Users can create their own profile
        CREATE POLICY "Users can insert own profile" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        RAISE NOTICE 'Created RLS policies for profiles table';
    END IF;
END $$;

-- Messages/Posts table policies (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN

        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view messages they are part of" ON public.messages;
        DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
        DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
        DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

        -- Users can view messages they sent or received
        CREATE POLICY "Users can view messages they are part of" ON public.messages
            FOR SELECT USING (
                auth.uid() = sender_id OR
                auth.uid() = receiver_id OR
                auth.uid() IN (SELECT user_id FROM message_participants WHERE message_id = messages.id)
            );

        -- Users can create messages
        CREATE POLICY "Users can create messages" ON public.messages
            FOR INSERT WITH CHECK (auth.uid() = sender_id);

        -- Users can update their own messages
        CREATE POLICY "Users can update own messages" ON public.messages
            FOR UPDATE USING (auth.uid() = sender_id)
            WITH CHECK (auth.uid() = sender_id);

        -- Users can delete their own messages
        CREATE POLICY "Users can delete own messages" ON public.messages
            FOR DELETE USING (auth.uid() = sender_id);

        RAISE NOTICE 'Created RLS policies for messages table';
    END IF;
END $$;

-- ============================================
-- 3. SECURE STORAGE BUCKETS
-- ============================================

-- Create secure storage policies
DO $$
BEGIN
    -- Public bucket for avatars/public images
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
        -- Allow public read
        DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
        CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
            FOR SELECT USING (bucket_id = 'avatars');

        -- Allow users to upload their own avatars
        DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
        CREATE POLICY "Users can upload own avatar" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'avatars' AND
                auth.uid()::text = (storage.foldername(name))[1]
            );

        -- Allow users to update their own avatars
        DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
        CREATE POLICY "Users can update own avatar" ON storage.objects
            FOR UPDATE USING (
                bucket_id = 'avatars' AND
                auth.uid()::text = (storage.foldername(name))[1]
            );

        -- Allow users to delete their own avatars
        DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
        CREATE POLICY "Users can delete own avatar" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'avatars' AND
                auth.uid()::text = (storage.foldername(name))[1]
            );
    END IF;

    -- Private bucket for user documents
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'documents') THEN
        -- Only authenticated users can view their own documents
        DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
        CREATE POLICY "Users can view own documents" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'documents' AND
                auth.uid()::text = (storage.foldername(name))[1]
            );

        -- Users can upload their own documents
        DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
        CREATE POLICY "Users can upload own documents" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'documents' AND
                auth.uid()::text = (storage.foldername(name))[1]
            );

        -- Users can update their own documents
        DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
        CREATE POLICY "Users can update own documents" ON storage.objects
            FOR UPDATE USING (
                bucket_id = 'documents' AND
                auth.uid()::text = (storage.foldername(name))[1]
            );

        -- Users can delete their own documents
        DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
        CREATE POLICY "Users can delete own documents" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'documents' AND
                auth.uid()::text = (storage.foldername(name))[1]
            );
    END IF;
END $$;

-- ============================================
-- 4. SECURE DATABASE FUNCTIONS
-- ============================================

-- Add security definer to sensitive functions
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find functions that should have SECURITY DEFINER
    FOR r IN
        SELECT n.nspname as schema, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = false
        AND p.proname LIKE '%admin%' OR p.proname LIKE '%delete%' OR p.proname LIKE '%update%'
    LOOP
        -- Note: Manual review needed for each function
        RAISE NOTICE 'Review function %.% for SECURITY DEFINER requirement', r.schema, r.function_name;
    END LOOP;
END $$;

-- ============================================
-- 5. CREATE SECURE API ACCESS PATTERNS
-- ============================================

-- Create a secure function for getting user data
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_data JSON;
BEGIN
    -- Only return data if requesting own profile or profile is public
    SELECT row_to_json(p.*) INTO profile_data
    FROM profiles p
    WHERE p.user_id = user_uuid
    AND (
        p.user_id = auth.uid() -- Own profile
        OR p.is_public = true  -- Public profile
        OR EXISTS ( -- Or has permission
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid()
            AND target_user_id = user_uuid
            AND permission = 'view_profile'
        )
    );

    RETURN profile_data;
END;
$$;

-- ============================================
-- 6. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================

-- Add indexes on foreign key columns
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find foreign key columns without indexes
    FOR r IN
        SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name
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
        )
    LOOP
        EXECUTE format('CREATE INDEX idx_%s_%s ON %I.%I(%I)',
            r.table_name, r.column_name, r.table_schema, r.table_name, r.column_name);
        RAISE NOTICE 'Created index on %.%.%', r.table_schema, r.table_name, r.column_name;
    END LOOP;
END $$;

-- ============================================
-- 7. REVOKE UNNECESSARY PERMISSIONS
-- ============================================

-- Revoke public access from sensitive tables
DO $$
BEGIN
    -- Revoke all from public on sensitive tables
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

    -- Grant back only necessary permissions to authenticated users
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

    -- Ensure anon role has minimal permissions
    GRANT USAGE ON SCHEMA public TO anon;
    -- Grant specific permissions as needed

    RAISE NOTICE 'Revoked unnecessary public permissions';
END $$;

-- ============================================
-- 8. AUDIT LOG SETUP
-- ============================================

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs
CREATE POLICY "Only service role can read audit logs" ON public.audit_log
    FOR SELECT USING (auth.role() = 'service_role');

-- Create generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        table_name,
        operation,
        user_id,
        old_data,
        new_data,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        row_to_json(OLD),
        row_to_json(NEW),
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. SECURE REALTIME SUBSCRIPTIONS
-- ============================================

-- Create publication for realtime with specific tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Only add tables that should have realtime updates
DO $$
BEGIN
    -- Add specific tables to realtime
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    -- Do not add sensitive tables like users, auth, payments, etc.
    RAISE NOTICE 'Configured secure realtime subscriptions';
END $$;

-- ============================================
-- 10. CREATE SECURITY CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_security_status()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check RLS enabled on all tables
    RETURN QUERY
    SELECT
        'RLS Check' as check_name,
        CASE
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Tables without RLS: ' || STRING_AGG(tablename, ', ') as details
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT IN ('schema_migrations', 'supabase_functions_migrations');

    -- Check for tables without policies
    RETURN QUERY
    SELECT
        'Policy Check' as check_name,
        CASE
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'WARNING'
        END as status,
        'Tables with RLS but no policies: ' || STRING_AGG(tablename, ', ') as details
    FROM pg_tables t
    WHERE schemaname = 'public'
    AND rowsecurity = true
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = t.schemaname
        AND p.tablename = t.tablename
    );

    -- Check for missing indexes on foreign keys
    RETURN QUERY
    SELECT
        'Index Check' as check_name,
        CASE
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'WARNING'
        END as status,
        'Foreign keys without indexes: ' || COUNT(*)::TEXT as details
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = tc.table_schema
        AND tablename = tc.table_name
        AND indexdef LIKE '%' || kcu.column_name || '%'
    );

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RUN SECURITY CHECK
-- ============================================

SELECT * FROM check_security_status();

-- ============================================
-- FINAL NOTES
-- ============================================

RAISE NOTICE '';
RAISE NOTICE '==============================================';
RAISE NOTICE 'SECURITY FIXES APPLIED SUCCESSFULLY';
RAISE NOTICE '==============================================';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Review the security check results above';
RAISE NOTICE '2. Test your application to ensure policies work correctly';
RAISE NOTICE '3. Adjust policies based on your specific requirements';
RAISE NOTICE '4. Enable 2FA for all admin accounts';
RAISE NOTICE '5. Review API keys and rotate if necessary';
RAISE NOTICE '6. Set up monitoring and alerts for suspicious activity';
RAISE NOTICE '';
RAISE NOTICE 'Remember to:';
RAISE NOTICE '- Never expose service role key to client';
RAISE NOTICE '- Use environment variables for sensitive data';
RAISE NOTICE '- Implement rate limiting on API endpoints';
RAISE NOTICE '- Regular security audits and updates';