-- Add optional category column to programmes table
-- Used to display category pills on the dashboard (e.g., "Strength & Hypertrophy")
ALTER TABLE public.programmes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;
