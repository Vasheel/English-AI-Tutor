-- Clean up progress data for removed components
-- Run this in your Supabase SQL Editor

-- Remove progress data for components that are no longer tracked
DELETE FROM public.user_progress 
WHERE activity_type IN ('grammar_tutor', 'exercise_generator', 'diagnostic_test');

-- Remove activity sessions for components that are no longer tracked
DELETE FROM public.activity_sessions 
WHERE activity_type IN ('grammar_tutor', 'exercise_generator', 'diagnostic_test');

-- Reset scores for Reading Comprehension and Topic Questions (keep only time tracking)
UPDATE public.user_progress 
SET 
  total_attempts = 0,
  correct_answers = 0,
  current_streak = 0,
  best_streak = 0
WHERE activity_type IN ('reading_comprehension', 'topic_questions');

-- Update activity_sessions to remove scores for time-only activities
UPDATE public.activity_sessions 
SET 
  score = 0,
  total_questions = 0
WHERE activity_type IN ('reading_comprehension', 'topic_questions');

-- Show summary of remaining activities
SELECT 
  activity_type,
  COUNT(*) as user_count,
  SUM(total_time_spent) as total_time_seconds,
  SUM(total_attempts) as total_attempts,
  SUM(correct_answers) as total_correct
FROM public.user_progress 
GROUP BY activity_type
ORDER BY activity_type;
