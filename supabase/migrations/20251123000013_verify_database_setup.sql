-- =====================================================
-- VERIFY DATABASE SETUP
-- Run this in Supabase SQL Editor after running all setup scripts
-- =====================================================

-- 1. Check All Tables Exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles',
  'programmes',
  'workouts',
  'analytics',
  'leaderboard_profiles',
  'leaderboard_stats',
  'pt_client_relationships',
  'pt_invitations',
  'shared_programmes',
  'client_progress_sharing'
)
ORDER BY table_name;

-- Expected: 10 rows (one for each table)

-- 2. Check RLS is Enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 
  'programmes', 
  'workouts', 
  'analytics', 
  'leaderboard_profiles', 
  'leaderboard_stats',
  'pt_client_relationships',
  'pt_invitations',
  'shared_programmes',
  'client_progress_sharing'
)
ORDER BY tablename;

-- Expected: All should show rowsecurity = true

-- 3. Check Triggers Exist
SELECT 
  tgname as trigger_name, 
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname IN (
  'on_auth_user_created', 
  'set_updated_at', 
  'trigger_update_leaderboard_profiles_updated_at',
  'trigger_update_leaderboard_stats_updated_at'
)
ORDER BY tgname;

-- Expected: Should return at least 'on_auth_user_created' trigger

-- 4. Check Indexes Exist
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'profiles',
  'programmes',
  'workouts',
  'analytics',
  'leaderboard_profiles',
  'leaderboard_stats'
)
ORDER BY tablename, indexname;

-- Expected: Multiple indexes per table for performance

-- 5. Check RLS Policies Exist
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'profiles',
  'programmes',
  'workouts',
  'analytics',
  'leaderboard_profiles',
  'leaderboard_stats'
)
ORDER BY tablename, policyname;

-- Expected: Multiple policies per table for security

-- 6. Summary Report
DO $$
DECLARE
  table_count INTEGER;
  rls_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'programmes', 'workouts', 'analytics',
    'leaderboard_profiles', 'leaderboard_stats',
    'pt_client_relationships', 'pt_invitations',
    'shared_programmes', 'client_progress_sharing'
  );
  
  -- Count RLS enabled tables
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true
  AND tablename IN (
    'profiles', 'programmes', 'workouts', 'analytics',
    'leaderboard_profiles', 'leaderboard_stats'
  );
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname IN (
    'on_auth_user_created',
    'set_updated_at',
    'trigger_update_leaderboard_profiles_updated_at',
    'trigger_update_leaderboard_stats_updated_at'
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE SETUP VERIFICATION REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created: % / 10', table_count;
  RAISE NOTICE 'RLS enabled: % / 6', rls_count;
  RAISE NOTICE 'Triggers created: % / 4', trigger_count;
  RAISE NOTICE '========================================';
  
  IF table_count = 10 AND rls_count >= 6 AND trigger_count >= 1 THEN
    RAISE NOTICE '✅ SETUP COMPLETE - All checks passed!';
  ELSE
    RAISE NOTICE '⚠️  SETUP INCOMPLETE - Please review the results above';
  END IF;
END $$;



