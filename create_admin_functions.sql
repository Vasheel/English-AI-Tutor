-- Simple admin functions for your English AI Tutor
-- Run this in your Supabase SQL Editor

-- Function to get all users
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.username,
    p.created_at,
    NULL::TIMESTAMP WITH TIME ZONE as last_sign_in_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get system statistics
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  total_questions BIGINT,
  total_sessions BIGINT,
  average_accuracy NUMERIC,
  popular_topics JSONB,
  last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count BIGINT;
  session_count BIGINT;
  question_count BIGINT;
  accuracy_sum NUMERIC;
BEGIN
  -- Get counts from existing tables
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  SELECT COUNT(*) INTO session_count FROM public.activity_sessions;
  
  -- Calculate questions and accuracy from sessions
  SELECT 
    COALESCE(SUM(total_questions), 0),
    COALESCE(SUM(score), 0)
  INTO question_count, accuracy_sum
  FROM public.activity_sessions;
  
  -- Add questions from user_progress
  SELECT question_count + COALESCE(SUM(total_attempts), 0)
  INTO question_count
  FROM public.user_progress;
  
  -- Calculate accuracy
  SELECT accuracy_sum + COALESCE(SUM(correct_answers), 0)
  INTO accuracy_sum
  FROM public.user_progress;
  
  -- Return results
  RETURN QUERY SELECT
    user_count,
    0::BIGINT as active_users,
    question_count,
    session_count,
    CASE WHEN question_count > 0 THEN (accuracy_sum / question_count) * 100 ELSE 0 END,
    '[]'::jsonb as popular_topics,
    NOW() as last_updated;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_stats() TO authenticated;
