-- Supabase Database Schema
-- Exported: 2026-02-01
-- Project: yshbcfifmkflhahjengk

-- ===========================================
-- TABLE: exercises
-- Reference data for workout exercises (populated by seed_exercises.sql)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.exercises (
    id text PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL,
    muscle_group text NOT NULL,
    type text NOT NULL CHECK (type IN ('compound', 'isolation')),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS but allow public read access (reference data)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read exercises
CREATE POLICY "Anyone can read exercises"
    ON public.exercises
    FOR SELECT
    TO public
    USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS exercises_category_idx ON public.exercises(category);
CREATE INDEX IF NOT EXISTS exercises_muscle_group_idx ON public.exercises(muscle_group);

-- ===========================================
-- TABLE: analytics
-- Stores exercise analytics/stats per user per day
-- ===========================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    exercise_id text NOT NULL,
    date date NOT NULL,
    max_weight numeric NOT NULL,
    total_volume numeric NOT NULL,
    total_reps integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: client_progress_sharing
-- Controls what data clients share with their PT
-- ===========================================
CREATE TABLE IF NOT EXISTS public.client_progress_sharing (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    share_workouts boolean NOT NULL DEFAULT true,
    share_analytics boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: leaderboard_profiles
-- User preferences for leaderboard participation
-- ===========================================
CREATE TABLE IF NOT EXISTS public.leaderboard_profiles (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    is_opted_in boolean DEFAULT false,
    display_name text NOT NULL,
    show_real_name boolean DEFAULT false,
    show_in_total_volume boolean DEFAULT true,
    show_in_monthly_volume boolean DEFAULT true,
    show_in_total_sessions boolean DEFAULT true,
    show_in_monthly_sessions boolean DEFAULT true,
    gender text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: leaderboard_stats
-- Cached leaderboard statistics and rankings
-- ===========================================
CREATE TABLE IF NOT EXISTS public.leaderboard_stats (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    total_volume_kg numeric DEFAULT 0,
    monthly_volume_kg numeric DEFAULT 0,
    total_sessions integer DEFAULT 0,
    monthly_sessions integer DEFAULT 0,
    monthly_period text,
    total_volume_rank integer,
    monthly_volume_rank integer,
    total_sessions_rank integer,
    monthly_sessions_rank integer,
    last_calculated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: profiles
-- User profile information
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL DEFAULT '',
    role text NOT NULL DEFAULT 'user',
    is_pt boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    accent_color text DEFAULT '#A855F7'
);

-- ===========================================
-- TABLE: programmes
-- Training programmes created by users
-- ===========================================
CREATE TABLE IF NOT EXISTS public.programmes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    days integer NOT NULL,
    weeks integer NOT NULL,
    exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: pt_client_relationships
-- Links between personal trainers and their clients
-- ===========================================
CREATE TABLE IF NOT EXISTS public.pt_client_relationships (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pt_id uuid NOT NULL,
    client_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: pt_invitations
-- Invitations sent by PTs to potential clients
-- ===========================================
CREATE TABLE IF NOT EXISTS public.pt_invitations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pt_id uuid NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: schedules
-- Weekly workout schedules for users
-- ===========================================
CREATE TABLE IF NOT EXISTS public.schedules (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    programme_id uuid,
    week_start date NOT NULL,
    schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ===========================================
-- TABLE: shared_programmes
-- Programmes shared by PTs with their clients
-- ===========================================
CREATE TABLE IF NOT EXISTS public.shared_programmes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    programme_id uuid NOT NULL,
    pt_id uuid NOT NULL,
    client_id uuid NOT NULL,
    shared_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: user_roles
-- Additional role assignments for users
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- TABLE: workouts
-- Completed workout sessions
-- ===========================================
CREATE TABLE IF NOT EXISTS public.workouts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    programme_id uuid,
    programme_name text NOT NULL,
    day integer NOT NULL,
    week integer NOT NULL,
    exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
    completed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- FOREIGN KEY RELATIONSHIPS (inferred)
-- ===========================================
-- analytics.exercise_id -> exercises.id
-- analytics.user_id -> auth.users.id
-- client_progress_sharing.client_id -> auth.users.id
-- leaderboard_profiles.user_id -> auth.users.id
-- leaderboard_stats.user_id -> auth.users.id
-- profiles.user_id -> auth.users.id
-- programmes.user_id -> auth.users.id
-- pt_client_relationships.pt_id -> auth.users.id
-- pt_client_relationships.client_id -> auth.users.id
-- pt_invitations.pt_id -> auth.users.id
-- schedules.user_id -> auth.users.id
-- schedules.programme_id -> programmes.id
-- shared_programmes.programme_id -> programmes.id
-- shared_programmes.pt_id -> auth.users.id
-- shared_programmes.client_id -> auth.users.id
-- user_roles.user_id -> auth.users.id
-- workouts.user_id -> auth.users.id
-- workouts.programme_id -> programmes.id
