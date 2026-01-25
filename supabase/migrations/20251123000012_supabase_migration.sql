-- =====================================================
-- SUPABASE NATIVE AUTH MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop the custom users table (if exists)
-- WARNING: This will delete all existing user data
-- Only run if you're starting fresh as per migration plan
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  is_pt BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);

-- Step 4: Create trigger function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, is_pt)
  VALUES (NEW.id, '', 'user', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for profiles
-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- PTs can view their clients' profiles
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

-- Step 8: Update RLS policies for programmes table
-- Ensure programmes table uses auth.uid() instead of custom user_id
DROP POLICY IF EXISTS "Users can view own programmes" ON public.programmes;
CREATE POLICY "Users can view own programmes"
  ON public.programmes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own programmes" ON public.programmes;
CREATE POLICY "Users can insert own programmes"
  ON public.programmes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own programmes" ON public.programmes;
CREATE POLICY "Users can update own programmes"
  ON public.programmes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own programmes" ON public.programmes;
CREATE POLICY "Users can delete own programmes"
  ON public.programmes FOR DELETE
  USING (auth.uid() = user_id);

-- Step 9: Update RLS policies for workouts table
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;
CREATE POLICY "Users can view own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workouts" ON public.workouts;
CREATE POLICY "Users can insert own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 10: Update RLS policies for analytics table
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
CREATE POLICY "Users can view own analytics"
  ON public.analytics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics;
CREATE POLICY "Users can insert own analytics"
  ON public.analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analytics" ON public.analytics;
CREATE POLICY "Users can update own analytics"
  ON public.analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 11: Update RLS policies for PT relationships
DROP POLICY IF EXISTS "PTs can view their relationships" ON public.pt_client_relationships;
CREATE POLICY "PTs can view their relationships"
  ON public.pt_client_relationships FOR SELECT
  USING (auth.uid() = pt_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "PTs can create relationships" ON public.pt_client_relationships;
CREATE POLICY "PTs can create relationships"
  ON public.pt_client_relationships FOR INSERT
  WITH CHECK (auth.uid() = pt_id);

DROP POLICY IF EXISTS "PTs can update their relationships" ON public.pt_client_relationships;
CREATE POLICY "PTs can update their relationships"
  ON public.pt_client_relationships FOR UPDATE
  USING (auth.uid() = pt_id);

-- Step 12: Update RLS policies for PT invitations
DROP POLICY IF EXISTS "PTs can view their invitations" ON public.pt_invitations;
CREATE POLICY "PTs can view their invitations"
  ON public.pt_invitations FOR SELECT
  USING (auth.uid() = pt_id);

DROP POLICY IF EXISTS "PTs can create invitations" ON public.pt_invitations;
CREATE POLICY "PTs can create invitations"
  ON public.pt_invitations FOR INSERT
  WITH CHECK (auth.uid() = pt_id);

-- Step 13: Update RLS policies for shared programmes
DROP POLICY IF EXISTS "Users can view shared programmes" ON public.shared_programmes;
CREATE POLICY "Users can view shared programmes"
  ON public.shared_programmes FOR SELECT
  USING (auth.uid() = pt_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "PTs can share programmes" ON public.shared_programmes;
CREATE POLICY "PTs can share programmes"
  ON public.shared_programmes FOR INSERT
  WITH CHECK (auth.uid() = pt_id);

DROP POLICY IF EXISTS "PTs can unshare programmes" ON public.shared_programmes;
CREATE POLICY "PTs can unshare programmes"
  ON public.shared_programmes FOR DELETE
  USING (auth.uid() = pt_id);

-- Step 14: Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify setup
-- =====================================================

-- Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
);

-- Check if trigger exists
SELECT EXISTS (
  SELECT FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- List all policies on profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
