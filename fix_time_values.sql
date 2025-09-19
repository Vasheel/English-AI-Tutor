-- Fix incorrect time values in the database
-- Run this SQL in your Supabase SQL Editor

-- Fix existing incorrect time values in activity_sessions table
UPDATE public.activity_sessions 
SET time_spent = LEAST(time_spent, 3600) -- Cap at 1 hour (3600 seconds)
WHERE time_spent > 3600;

-- Fix existing incorrect time values in user_progress table
UPDATE public.user_progress 
SET total_time_spent = LEAST(total_time_spent, 3600) -- Cap at 1 hour (3600 seconds)
WHERE total_time_spent > 3600;

-- Add constraints to prevent future incorrect time values
-- First drop existing constraints if they exist
DO $$ 
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_time_spent_reasonable' 
        AND table_name = 'activity_sessions'
    ) THEN
        ALTER TABLE public.activity_sessions DROP CONSTRAINT check_time_spent_reasonable;
    END IF;
    
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_user_progress_time_reasonable' 
        AND table_name = 'user_progress'
    ) THEN
        ALTER TABLE public.user_progress DROP CONSTRAINT check_user_progress_time_reasonable;
    END IF;
END $$;

-- Add the constraints
ALTER TABLE public.activity_sessions 
ADD CONSTRAINT check_time_spent_reasonable 
CHECK (time_spent >= 0 AND time_spent <= 3600); -- Max 1 hour per session

ALTER TABLE public.user_progress 
ADD CONSTRAINT check_user_progress_time_reasonable 
CHECK (total_time_spent >= 0 AND total_time_spent <= 86400); -- Max 24 hours total

-- Show summary of fixes
SELECT 
  'activity_sessions' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN time_spent > 3600 THEN 1 END) as fixed_records
FROM public.activity_sessions
UNION ALL
SELECT 
  'user_progress' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN total_time_spent > 3600 THEN 1 END) as fixed_records
FROM public.user_progress;
