-- Fix any corrupted schedule data in the schedules table

-- First, check for any invalid JSONB data
-- (This is just for information - run this separately to see if there are issues)
SELECT id, user_id, week_start, schedule, 
       CASE 
         WHEN jsonb_typeof(schedule) = 'array' THEN 'Valid Array'
         ELSE 'Invalid: ' || jsonb_typeof(schedule)
       END as status
FROM public.schedules;

-- Delete any rows where schedule is not a proper JSONB array
DELETE FROM public.schedules 
WHERE jsonb_typeof(schedule) != 'array';

-- If you want to fix them instead of deleting, use this:
-- UPDATE public.schedules 
-- SET schedule = '[]'::jsonb 
-- WHERE jsonb_typeof(schedule) != 'array';

-- Verify all remaining schedules have proper structure
SELECT id, user_id, week_start, 
       jsonb_array_length(schedule) as day_count,
       schedule
FROM public.schedules;
