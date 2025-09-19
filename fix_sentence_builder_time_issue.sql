-- Fix sentence builder time tracking issues
-- Run this in your Supabase SQL Editor

-- First, let's see what the current data looks like
SELECT 
  activity_type,
  user_id,
  total_time_spent,
  total_attempts,
  correct_answers,
  last_activity
FROM public.user_progress 
WHERE activity_type = 'sentence_builder'
ORDER BY total_time_spent DESC;

-- Check activity_sessions for sentence_builder
SELECT 
  activity_type,
  user_id,
  time_spent,
  score,
  created_at
FROM public.activity_sessions 
WHERE activity_type = 'sentence_builder'
ORDER BY time_spent DESC;

-- Reset sentence builder time if it's unreasonably high (more than 1 hour = 3600 seconds)
UPDATE public.user_progress 
SET total_time_spent = 0
WHERE activity_type = 'sentence_builder' 
  AND total_time_spent > 3600;

-- Reset activity_sessions time if it's unreasonably high
UPDATE public.activity_sessions 
SET time_spent = 30  -- Set to 30 seconds as a reasonable default
WHERE activity_type = 'sentence_builder' 
  AND time_spent > 3600;

-- Show updated data
SELECT 
  activity_type,
  COUNT(*) as user_count,
  SUM(total_time_spent) as total_time_seconds,
  AVG(total_time_spent) as avg_time_seconds,
  MAX(total_time_spent) as max_time_seconds
FROM public.user_progress 
WHERE activity_type = 'sentence_builder'
GROUP BY activity_type;
