-- Comprehensive fix for all time tracking issues
-- Run this SQL in your Supabase SQL Editor

-- 1. First, let's see what's currently in the database
SELECT 
  'Current Data Summary' as section,
  activity_type,
  COUNT(*) as records,
  AVG(total_time_spent) as avg_time,
  MAX(total_time_spent) as max_time,
  MIN(total_time_spent) as min_time
FROM public.user_progress 
GROUP BY activity_type
ORDER BY activity_type;

-- 2. Reset ALL incorrect time values to 0
UPDATE public.user_progress 
SET total_time_spent = 0
WHERE total_time_spent > 3600; -- Reset if more than 1 hour

-- 3. Reset activity_sessions with incorrect time values
UPDATE public.activity_sessions 
SET time_spent = LEAST(time_spent, 300) -- Cap at 5 minutes per session
WHERE time_spent > 300;

-- 4. Add constraints to prevent future incorrect values
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_time_spent_reasonable' 
        AND table_name = 'activity_sessions'
    ) THEN
        ALTER TABLE public.activity_sessions DROP CONSTRAINT check_time_spent_reasonable;
    END IF;
    
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
CHECK (time_spent >= 0 AND time_spent <= 300); -- Max 5 minutes per session

ALTER TABLE public.user_progress 
ADD CONSTRAINT check_user_progress_time_reasonable 
CHECK (total_time_spent >= 0 AND total_time_spent <= 3600); -- Max 1 hour total

-- 5. Show summary of fixes
SELECT 
  'Fix Summary' as section,
  'user_progress' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN total_time_spent = 0 THEN 1 END) as reset_records
FROM public.user_progress
UNION ALL
SELECT 
  'Fix Summary' as section,
  'activity_sessions' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN time_spent <= 300 THEN 1 END) as capped_records
FROM public.activity_sessions;

-- 6. Show final data summary
SELECT 
  'Final Data Summary' as section,
  activity_type,
  COUNT(*) as records,
  AVG(total_time_spent) as avg_time,
  MAX(total_time_spent) as max_time,
  MIN(total_time_spent) as min_time
FROM public.user_progress 
GROUP BY activity_type
ORDER BY activity_type;
