# Supabase Security Fix Guide

## 📋 Quick Fix for Security Warnings

### Step 1: Run the Security Fix Script

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix_supabase_warnings.sql`
4. Click **Run**

This will:
- ✅ Enable RLS on all tables
- ✅ Create basic authentication policies
- ✅ Revoke unnecessary permissions
- ✅ Set up secure storage policies

### Step 2: Apply Comprehensive Security

For complete security hardening:

1. In SQL Editor, run `supabase_security_comprehensive_fixes.sql`
2. This adds:
   - Audit logging
   - Security monitoring functions
   - Optimized indexes
   - Advanced RLS policies

### Step 3: Verify Security Status

Run this query in SQL Editor to check your security status:

```sql
-- Check current security warnings
WITH security_check AS (
    SELECT
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) as no_rls,
        (SELECT COUNT(*) FROM pg_tables t WHERE schemaname = 'public' AND rowsecurity = true
         AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename)) as no_policies,
        (SELECT COUNT(*) FROM storage.buckets WHERE public = true) as public_buckets
)
SELECT
    CASE WHEN no_rls + no_policies + public_buckets = 0
         THEN '✅ Security checks passed!'
         ELSE '⚠️ Issues found: ' || no_rls || ' tables without RLS, ' ||
              no_policies || ' tables without policies, ' ||
              public_buckets || ' public buckets'
    END as security_status
FROM security_check;
```

## 🔒 What Each Warning Means

### Warning 1: "Tables without Row Level Security"
**Risk**: Anyone can read/write your data
**Fix**: Enable RLS on all tables

### Warning 2: "Tables with RLS but no policies"
**Risk**: RLS is enabled but not configured - blocks ALL access
**Fix**: Add appropriate policies for each table

### Warning 3: "Functions accessible by anonymous users"
**Risk**: Unauthenticated users can execute database functions
**Fix**: Revoke EXECUTE from anon role

### Warning 4: "Public storage buckets"
**Risk**: Files can be accessed without authentication
**Fix**: Make buckets private and add policies

### Warning 5: "Missing indexes on foreign keys"
**Risk**: Poor query performance
**Fix**: Add indexes on foreign key columns

### Warning 6: "Exposed API endpoints"
**Risk**: API abuse and data leaks
**Fix**: Implement rate limiting and authentication

## 🛠️ Manual Steps Required

### 1. Update Your Application Code

```javascript
// Ensure you're using the anon key for client-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // NOT the service key!
)

// Always check authentication
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  throw new Error('Not authenticated')
}
```

### 2. Configure API Security

In Supabase Dashboard > Settings > API:

- [ ] Enable "Enforce SSL"
- [ ] Set rate limits (e.g., 100 requests per minute)
- [ ] Configure CORS for your domains only
- [ ] Rotate API keys if compromised

### 3. Set Up Environment Variables

```env
# .env.local (for Next.js)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# .env (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # NEVER expose to client!
```

### 4. Enable 2FA

1. Go to Dashboard > Authentication > Policies
2. Enable "Require MFA" for sensitive operations
3. Configure TOTP or SMS authentication

## 🎯 Testing Your Security

### Test 1: RLS Policies

```javascript
// This should fail if RLS is working
const { data, error } = await supabase
  .from('users')
  .select('*')  // Should only return current user's data

if (data?.length > 1) {
  console.error('❌ RLS not working - seeing other users data!')
}
```

### Test 2: Storage Security

```javascript
// Try accessing private files without auth
const { data, error } = await supabase
  .storage
  .from('private-bucket')
  .download('file.pdf')

if (!error) {
  console.error('❌ Storage not secured!')
}
```

### Test 3: Anonymous Access

```javascript
// Sign out and try accessing data
await supabase.auth.signOut()

const { data, error } = await supabase
  .from('protected_table')
  .select('*')

if (!error) {
  console.error('❌ Anonymous users can access protected data!')
}
```

## 📊 Security Checklist

- [ ] All tables have RLS enabled
- [ ] Each table has appropriate policies
- [ ] Service role key is server-side only
- [ ] API rate limiting enabled
- [ ] SSL enforced
- [ ] Storage buckets are private
- [ ] Functions have SECURITY DEFINER where needed
- [ ] Audit logging enabled
- [ ] 2FA enabled for admin accounts
- [ ] Regular security audits scheduled

## 🚨 Emergency Response

If you suspect a breach:

1. **Immediately rotate all keys** in Dashboard > Settings > API
2. **Revoke all user sessions**:
   ```sql
   DELETE FROM auth.sessions;
   ```
3. **Check audit logs**:
   ```sql
   SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 100;
   ```
4. **Lock down access**:
   ```sql
   REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
   ```

## 📝 Notes

- Always test in a development environment first
- Keep backups before making schema changes
- Document all custom policies
- Review security monthly
- Subscribe to Supabase security updates

## Need Help?

- [Supabase Security Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS Examples](https://supabase.com/docs/guides/auth/row-level-security#examples)
- [Storage Security](https://supabase.com/docs/guides/storage/security)