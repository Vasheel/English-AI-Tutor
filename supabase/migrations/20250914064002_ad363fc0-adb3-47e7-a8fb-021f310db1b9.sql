-- Fix remaining security issue with word_scramble_performance view
-- Since views inherit RLS from underlying tables, we need to ensure the view is properly configured

-- Recreate the word_scramble_performance view with proper security
DROP VIEW IF EXISTS public.word_scramble_performance;

-- Recreate the view with security invoker (safer than security definer)
CREATE VIEW public.word_scramble_performance 
WITH (security_invoker = on) AS 
SELECT 
    user_id,
    count(*) AS total_words_attempted,
    sum(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_answers,
    round(avg(CASE WHEN is_correct THEN 100 ELSE 0 END), 2) AS accuracy_percentage,
    round(avg(response_time_seconds), 2) AS avg_response_time,
    sum(hints_used) AS total_hints_used,
    max(streak_at_time) AS best_streak,
    sum(points_earned) AS total_points,
    count(DISTINCT date(created_at)) AS days_played,
    count(DISTINCT session_id) AS total_sessions
FROM word_scramble_analytics
WHERE user_id = auth.uid() -- Explicitly filter to current user only
GROUP BY user_id;

-- Add comment explaining the security
COMMENT ON VIEW public.word_scramble_performance IS 'Aggregated performance metrics for word scramble game. Filtered to show only current user data for security.';

-- Ensure the view has proper permissions
GRANT SELECT ON public.word_scramble_performance TO authenticated;
REVOKE ALL ON public.word_scramble_performance FROM anon, public;