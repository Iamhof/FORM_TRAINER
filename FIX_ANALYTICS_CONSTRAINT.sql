-- =====================================================
-- FIX ANALYTICS TABLE - ADD UNIQUE CONSTRAINT
-- This fixes the issue where analytics aren't updating
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add unique constraint on (user_id, exercise_id, date)
-- This allows upsert to work properly when logging workouts
ALTER TABLE public.analytics 
ADD CONSTRAINT analytics_user_exercise_date_unique 
UNIQUE (user_id, exercise_id, date);

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.analytics'::regclass
  AND conname = 'analytics_user_exercise_date_unique';

-- Check existing analytics data
SELECT 
  user_id,
  exercise_id,
  date,
  COUNT(*) as count
FROM public.analytics
GROUP BY user_id, exercise_id, date
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- If you see duplicates above, you need to clean them up first:
-- Uncomment the following if you have duplicates:

/*
-- Remove duplicate analytics records, keeping only the most recent
DELETE FROM public.analytics a
USING (
  SELECT 
    user_id,
    exercise_id,
    date,
    MAX(created_at) as max_created_at
  FROM public.analytics
  GROUP BY user_id, exercise_id, date
  HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id
  AND a.exercise_id = b.exercise_id
  AND a.date = b.date
  AND a.created_at < b.max_created_at;
*/
