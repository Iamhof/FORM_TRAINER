-- =====================================================
-- COMPLETE SUPABASE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- This will create all tables and set up authentication
-- =====================================================

-- Step 1: Drop existing tables if they exist (CLEAN SLATE)
DROP TABLE IF EXISTS public.shared_programmes CASCADE;
DROP TABLE IF EXISTS public.pt_invitations CASCADE;
DROP TABLE IF EXISTS public.client_progress_sharing CASCADE;
DROP TABLE IF EXISTS public.pt_client_relationships CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.programmes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  is_pt BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);

-- Step 3: Create programmes table
CREATE TABLE public.programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  days INTEGER NOT NULL,
  weeks INTEGER NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX programmes_user_id_idx ON public.programmes(user_id);

-- Step 4: Create workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  programme_id UUID REFERENCES public.programmes(id) ON DELETE CASCADE,
  programme_name TEXT NOT NULL,
  day INTEGER NOT NULL,
  week INTEGER NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX workouts_user_id_idx ON public.workouts(user_id);
CREATE INDEX workouts_programme_id_idx ON public.workouts(programme_id);

-- Step 5: Create analytics table
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  date DATE NOT NULL,
  max_weight NUMERIC NOT NULL,
  total_volume NUMERIC NOT NULL,
  total_reps INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX analytics_user_id_idx ON public.analytics(user_id);
CREATE INDEX analytics_exercise_id_idx ON public.analytics(exercise_id);
CREATE INDEX analytics_date_idx ON public.analytics(date);

-- Step 6: Create PT-Client relationships table
CREATE TABLE public.pt_client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pt_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pt_id, client_id)
);

CREATE INDEX pt_client_relationships_pt_id_idx ON public.pt_client_relationships(pt_id);
CREATE INDEX pt_client_relationships_client_id_idx ON public.pt_client_relationships(client_id);

-- Step 7: Create PT invitations table
CREATE TABLE public.pt_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pt_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX pt_invitations_pt_id_idx ON public.pt_invitations(pt_id);
CREATE INDEX pt_invitations_token_idx ON public.pt_invitations(token);

-- Step 8: Create shared programmes table
CREATE TABLE public.shared_programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id UUID REFERENCES public.programmes(id) ON DELETE CASCADE NOT NULL,
  pt_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(programme_id, client_id)
);

CREATE INDEX shared_programmes_programme_id_idx ON public.shared_programmes(programme_id);
CREATE INDEX shared_programmes_pt_id_idx ON public.shared_programmes(pt_id);
CREATE INDEX shared_programmes_client_id_idx ON public.shared_programmes(client_id);

-- Step 9: Create client progress sharing settings table
CREATE TABLE public.client_progress_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  share_workouts BOOLEAN NOT NULL DEFAULT true,
  share_analytics BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX client_progress_sharing_client_id_idx ON public.client_progress_sharing(client_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, is_pt)
  VALUES (NEW.id, '', 'user', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at on profiles
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

DROP TRIGGER IF EXISTS set_updated_at ON public.programmes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.programmes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.pt_client_relationships;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.pt_client_relationships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.client_progress_sharing;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.client_progress_sharing
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_client_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_progress_sharing ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "PTs can view client profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = (select auth.uid())
      AND client_id = profiles.user_id
      AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES - PROGRAMMES
-- =====================================================

CREATE POLICY "Users can see own programmes"
  ON public.programmes FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Clients can see PT-shared programmes"
  ON public.programmes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_programmes
      WHERE programme_id = programmes.id
      AND client_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create own programmes"
  ON public.programmes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "PTs can create programmes for clients"
  ON public.programmes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = (select auth.uid())
      AND client_id = user_id
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage own programmes"
  ON public.programmes FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "PTs can manage client programmes"
  ON public.programmes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = (select auth.uid())
      AND client_id = programmes.user_id
      AND status = 'active'
    )
  );

CREATE POLICY "Users can delete own programmes"
  ON public.programmes FOR DELETE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "PTs can delete client programmes"
  ON public.programmes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = (select auth.uid())
      AND client_id = programmes.user_id
      AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES - WORKOUTS
-- =====================================================

CREATE POLICY "Users can manage own workouts"
  ON public.workouts FOR ALL
  USING ((select auth.uid()) = user_id);

CREATE POLICY "PTs can view client workouts"
  ON public.workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships pcr
      JOIN public.client_progress_sharing cps ON cps.client_id = pcr.client_id
      WHERE pcr.pt_id = (select auth.uid())
      AND pcr.client_id = workouts.user_id
      AND pcr.status = 'active'
      AND cps.share_workouts = true
    )
  );

-- =====================================================
-- RLS POLICIES - ANALYTICS
-- =====================================================

CREATE POLICY "Users can manage own analytics"
  ON public.analytics FOR ALL
  USING ((select auth.uid()) = user_id);

CREATE POLICY "PTs can view client analytics"
  ON public.analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships pcr
      JOIN public.client_progress_sharing cps ON cps.client_id = pcr.client_id
      WHERE pcr.pt_id = (select auth.uid())
      AND pcr.client_id = analytics.user_id
      AND pcr.status = 'active'
      AND cps.share_analytics = true
    )
  );

-- =====================================================
-- RLS POLICIES - PT CLIENT RELATIONSHIPS
-- =====================================================

CREATE POLICY "PTs can manage their clients"
  ON public.pt_client_relationships FOR ALL
  USING ((select auth.uid()) = pt_id);

CREATE POLICY "Clients can see their PT relationships"
  ON public.pt_client_relationships FOR SELECT
  USING ((select auth.uid()) = client_id);

-- =====================================================
-- RLS POLICIES - PT INVITATIONS
-- =====================================================

CREATE POLICY "PTs can manage invitations"
  ON public.pt_invitations FOR ALL
  USING ((select auth.uid()) = pt_id);

-- =====================================================
-- RLS POLICIES - SHARED PROGRAMMES
-- =====================================================

CREATE POLICY "PTs can share programmes"
  ON public.shared_programmes FOR INSERT
  WITH CHECK ((select auth.uid()) = pt_id);

CREATE POLICY "PTs can unshare programmes"
  ON public.shared_programmes FOR DELETE
  USING ((select auth.uid()) = pt_id);

CREATE POLICY "Users can view shared programmes"
  ON public.shared_programmes FOR SELECT
  USING ((select auth.uid()) = pt_id OR (select auth.uid()) = client_id);

-- =====================================================
-- RLS POLICIES - CLIENT PROGRESS SHARING
-- =====================================================

CREATE POLICY "Clients can manage sharing settings"
  ON public.client_progress_sharing FOR ALL
  USING ((select auth.uid()) = client_id);

CREATE POLICY "PTs can view sharing settings"
  ON public.client_progress_sharing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_client_relationships
      WHERE pt_id = (select auth.uid())
      AND client_id = client_progress_sharing.client_id
      AND status = 'active'
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all tables exist
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
  'pt_client_relationships',
  'pt_invitations',
  'shared_programmes',
  'client_progress_sharing'
)
ORDER BY table_name;
