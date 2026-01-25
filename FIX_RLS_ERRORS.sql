-- =====================================================
-- FIX RLS POLICY ERRORS AFTER MIGRATION
-- This fixes potential issues with the performance migration
-- =====================================================

-- First, let's verify what policies exist
-- Run CHECK_MIGRATION_ERRORS.sql first to see what's missing

-- =====================================================
-- FIX: Ensure analytics table has proper policies
-- =====================================================

-- Drop and recreate analytics policies to ensure they're correct
DROP POLICY IF EXISTS "Users can manage own analytics" ON public.analytics;
DROP POLICY IF EXISTS "PTs can view client analytics" ON public.analytics;

-- Recreate with proper structure
CREATE POLICY "Users can manage own analytics"
  ON public.analytics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "PTs can view client analytics"
  ON public.analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships pcr
      JOIN public.client_progress_sharing cps ON cps.client_id = pcr.client_id
      WHERE pcr.pt_id = auth.uid()
      AND pcr.client_id = analytics.user_id
      AND pcr.status = 'active'
      AND cps.share_analytics = true
    )
  );

-- =====================================================
-- VERIFY: Check all critical tables have policies
-- =====================================================

DO $$
DECLARE
  missing_policies TEXT[] := ARRAY[]::TEXT[];
  table_name TEXT;
  policy_count INTEGER;
BEGIN
  FOR table_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND rowsecurity = true
      AND tablename IN ('profiles', 'programmes', 'workouts', 'analytics', 'schedules')
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = table_name;
    
    IF policy_count = 0 THEN
      missing_policies := array_append(missing_policies, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_policies, 1) > 0 THEN
    RAISE WARNING 'Tables with RLS enabled but no policies: %', array_to_string(missing_policies, ', ');
  ELSE
    RAISE NOTICE 'All critical tables have RLS policies';
  END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policy fix completed. Please test your app again.';
END $$;
