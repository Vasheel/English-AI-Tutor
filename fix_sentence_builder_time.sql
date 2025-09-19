-- Fix sentence builder time issue
-- Run this SQL in your Supabase SQL Editor

-- First, let's see what's in the sentence builder data
SELECT 
  activity_type,
  total_attempts,
  correct_answers,
  total_time_spent,
  created_at,
  updated_at
FROM public.user_progress 
WHERE activity_type = 'sentence_builder'
ORDER BY updated_at DESC;

-- Reset sentence builder time to 0 if it's showing incorrect values
UPDATE public.user_progress 
SET total_time_spent = 0
WHERE activity_type = 'sentence_builder' 
  AND total_time_spent > 3600; -- Reset if more than 1 hour

-- Also fix any activity_sessions with incorrect sentence builder time
UPDATE public.activity_sessions 
SET time_spent = LEAST(time_spent, 300) -- Cap at 5 minutes per session
WHERE activity_type = 'sentence_builder' 
  AND time_spent > 300;

-- Show the results
SELECT 
  'user_progress' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN total_time_spent > 3600 THEN 1 END) as fixed_records
FROM public.user_progress
WHERE activity_type = 'sentence_builder'
UNION ALL
SELECT 
  'activity_sessions' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN time_spent > 300 THEN 1 END) as fixed_records
FROM public.activity_sessions
WHERE activity_type = 'sentence_builder';
