-- Migration: Create exercises table
-- This table stores reference data for workout exercises
-- Run this migration, then run seed_exercises.sql to populate data

-- ===========================================
-- TABLE: exercises
-- Reference data for workout exercises
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

-- Policy: Anyone can read exercises (including unauthenticated users)
-- This is reference data that all users need to access
CREATE POLICY "Anyone can read exercises"
    ON public.exercises
    FOR SELECT
    TO public
    USING (true);

-- Note: Only service role can insert/update/delete (admin only)
-- No explicit policy needed - RLS blocks by default for non-service-role

-- Create index for common queries
CREATE INDEX IF NOT EXISTS exercises_category_idx ON public.exercises(category);
CREATE INDEX IF NOT EXISTS exercises_muscle_group_idx ON public.exercises(muscle_group);
