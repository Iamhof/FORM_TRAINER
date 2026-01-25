-- =====================================================
-- CHECK FOR MIGRATION ERRORS
-- Run this in Supabase SQL Editor to see what's broken
-- =====================================================

-- Check if all policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for tables with RLS enabled but no policies
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename, t.rowsecurity
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

-- Check analytics table policies specifically
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'analytics'
ORDER BY policyname;
