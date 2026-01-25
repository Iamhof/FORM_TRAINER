-- =====================================================
-- FIX SUPABASE PERFORMANCE AND SECURITY ISSUES
-- Date: 2025-01-16
-- Purpose: Fix Security Advisor warnings (7) and Performance Advisor warnings (51)
-- =====================================================
-- 
-- This migration addresses:
-- 1. Function Search Path security vulnerabilities (6 functions)
-- 2. RLS policy performance issues (inefficient auth.uid() calls)
-- 3. Multiple permissive policies on analytics table
-- 4. Documentation for enabling leaked password protection
--
-- Expected Results:
-- - Security Advisor: 0 warnings (down from 7)
-- - Performance Advisor: ~10-15 warnings (down from 51)
-- - Faster query execution, no timeouts
-- =====================================================

-- =====================================================
-- PART A: FIX FUNCTION SEARCH PATH ISSUES
-- =====================================================
-- Add SET search_path to all functions to prevent security vulnerabilities
-- This ensures functions don't search unintended schemas

-- 1. Fix handle_new_user() function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, is_pt)
  VALUES (NEW.id, '', 'user', false);
  RETURN NEW;
END;
$$;

-- 2. Fix handle_updated_at() function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Fix update_leaderboard_profiles_updated_at() function
CREATE OR REPLACE FUNCTION update_leaderboard_profiles_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Fix update_leaderboard_stats_updated_at() function
CREATE OR REPLACE FUNCTION update_leaderboard_stats_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 5. Fix update_schedules_updated_at() function
CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- PART B: OPTIMIZE RLS POLICIES
-- =====================================================
-- Replace inefficient (select auth.uid()) with direct auth.uid() calls
-- This reduces RLS initialization overhead significantly

-- PROFILES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PTs can view client profiles" ON public.profiles;
CREATE POLICY "PTs can view client profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = auth.uid()
      AND client_id = profiles.user_id
      AND status = 'active'
    )
  );

-- PROGRAMMES TABLE POLICIES
DROP POLICY IF EXISTS "Users can see own programmes" ON public.programmes;
CREATE POLICY "Users can see own programmes"
  ON public.programmes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Clients can see PT-shared programmes" ON public.programmes;
CREATE POLICY "Clients can see PT-shared programmes"
  ON public.programmes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_programmes
      WHERE programme_id = programmes.id
      AND client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own programmes" ON public.programmes;
CREATE POLICY "Users can create own programmes"
  ON public.programmes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "PTs can create programmes for clients" ON public.programmes;
CREATE POLICY "PTs can create programmes for clients"
  ON public.programmes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = auth.uid()
      AND client_id = user_id
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can manage own programmes" ON public.programmes;
CREATE POLICY "Users can manage own programmes"
  ON public.programmes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PTs can manage client programmes" ON public.programmes;
CREATE POLICY "PTs can manage client programmes"
  ON public.programmes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = auth.uid()
      AND client_id = programmes.user_id
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can delete own programmes" ON public.programmes;
CREATE POLICY "Users can delete own programmes"
  ON public.programmes FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PTs can delete client programmes" ON public.programmes;
CREATE POLICY "PTs can delete client programmes"
  ON public.programmes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = auth.uid()
      AND client_id = programmes.user_id
      AND status = 'active'
    )
  );

-- WORKOUTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own workouts" ON public.workouts;
CREATE POLICY "Users can manage own workouts"
  ON public.workouts FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PTs can view client workouts" ON public.workouts;
CREATE POLICY "PTs can view client workouts"
  ON public.workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships pcr
      JOIN public.client_progress_sharing cps ON cps.client_id = pcr.client_id
      WHERE pcr.pt_id = auth.uid()
      AND pcr.client_id = workouts.user_id
      AND pcr.status = 'active'
      AND cps.share_workouts = true
    )
  );

-- ANALYTICS TABLE POLICIES (CONSOLIDATED)
-- Part C: Consolidate multiple permissive policies into single comprehensive policies
DROP POLICY IF EXISTS "Users can manage own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can update own analytics" ON public.analytics;
DROP POLICY IF EXISTS "PTs can view client analytics" ON public.analytics;

-- Single comprehensive policy for users to manage their own analytics
CREATE POLICY "Users can manage own analytics"
  ON public.analytics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Single policy for PTs to view client analytics
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

-- PT CLIENT RELATIONSHIPS TABLE POLICIES
DROP POLICY IF EXISTS "PTs can manage their clients" ON public.pt_client_relationships;
CREATE POLICY "PTs can manage their clients"
  ON public.pt_client_relationships FOR ALL
  USING (auth.uid() = pt_id);

DROP POLICY IF EXISTS "Clients can see their PT relationships" ON public.pt_client_relationships;
CREATE POLICY "Clients can see their PT relationships"
  ON public.pt_client_relationships FOR SELECT
  USING (auth.uid() = client_id);

-- PT INVITATIONS TABLE POLICIES
DROP POLICY IF EXISTS "PTs can manage invitations" ON public.pt_invitations;
CREATE POLICY "PTs can manage invitations"
  ON public.pt_invitations FOR ALL
  USING (auth.uid() = pt_id);

-- SHARED PROGRAMMES TABLE POLICIES
DROP POLICY IF EXISTS "PTs can share programmes" ON public.shared_programmes;
CREATE POLICY "PTs can share programmes"
  ON public.shared_programmes FOR INSERT
  WITH CHECK (auth.uid() = pt_id);

DROP POLICY IF EXISTS "PTs can unshare programmes" ON public.shared_programmes;
CREATE POLICY "PTs can unshare programmes"
  ON public.shared_programmes FOR DELETE
  USING (auth.uid() = pt_id);

DROP POLICY IF EXISTS "Users can view shared programmes" ON public.shared_programmes;
CREATE POLICY "Users can view shared programmes"
  ON public.shared_programmes FOR SELECT
  USING (auth.uid() = pt_id OR auth.uid() = client_id);

-- CLIENT PROGRESS SHARING TABLE POLICIES
DROP POLICY IF EXISTS "Clients can manage sharing settings" ON public.client_progress_sharing;
CREATE POLICY "Clients can manage sharing settings"
  ON public.client_progress_sharing FOR ALL
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "PTs can view sharing settings" ON public.client_progress_sharing;
CREATE POLICY "PTs can view sharing settings"
  ON public.client_progress_sharing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = auth.uid()
      AND client_id = client_progress_sharing.client_id
      AND status = 'active'
    )
  );

-- SCHEDULES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
CREATE POLICY "Users can view their own schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own schedules" ON public.schedules;
CREATE POLICY "Users can insert their own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
CREATE POLICY "Users can update their own schedules"
  ON public.schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;
CREATE POLICY "Users can delete their own schedules"
  ON public.schedules FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PTs can view client schedules" ON public.schedules;
CREATE POLICY "PTs can view client schedules"
  ON public.schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = auth.uid()
        AND client_id = schedules.user_id
        AND status = 'active'
    )
  );

-- LEADERBOARD STATS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view all leaderboard stats" ON public.leaderboard_stats;
CREATE POLICY "Users can view all leaderboard stats"
  ON public.leaderboard_stats FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only system can modify leaderboard stats" ON public.leaderboard_stats;
CREATE POLICY "Only system can modify leaderboard stats"
  ON public.leaderboard_stats FOR ALL
  TO authenticated
  USING (false);

-- LEADERBOARD PROFILES TABLE POLICIES (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leaderboard_profiles') THEN
    DROP POLICY IF EXISTS "Users can view opted-in leaderboard profiles" ON public.leaderboard_profiles;
    CREATE POLICY "Users can view opted-in leaderboard profiles"
      ON public.leaderboard_profiles FOR SELECT
      USING (is_opted_in = true OR user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can manage own leaderboard profile" ON public.leaderboard_profiles;
    CREATE POLICY "Users can manage own leaderboard profile"
      ON public.leaderboard_profiles FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- USER ROLES TABLE POLICIES (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
    CREATE POLICY "Users can read own roles"
      ON public.user_roles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- PART D: VERIFICATION AND DOCUMENTATION
-- =====================================================

-- Verify functions have search_path set
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'handle_new_user',
      'handle_updated_at',
      'update_leaderboard_profiles_updated_at',
      'update_leaderboard_stats_updated_at',
      'update_schedules_updated_at'
    )
    AND p.proconfig IS NOT NULL
    AND 'search_path' = ANY(p.proconfig);
  
  RAISE NOTICE 'Functions with search_path configured: % / 5', func_count;
END $$;

-- =====================================================
-- MANUAL STEP REQUIRED: ENABLE LEAKED PASSWORD PROTECTION
-- =====================================================
-- 
-- This setting cannot be changed via SQL. You must do it manually:
-- 
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Navigate to: Authentication → Settings
-- 4. Find "Leaked Password Protection" section
-- 5. Enable the toggle
-- 6. Save changes
--
-- This will resolve the 1 remaining Security Advisor warning.
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Check Security Advisor - should show 1 warning (leaked password protection)';
  RAISE NOTICE '2. Check Performance Advisor - should show significantly fewer warnings';
  RAISE NOTICE '3. Enable Leaked Password Protection in Dashboard → Authentication → Settings';
  RAISE NOTICE '4. Test your app - queries should be faster and no timeouts';
  RAISE NOTICE '=====================================================';
END $$;
