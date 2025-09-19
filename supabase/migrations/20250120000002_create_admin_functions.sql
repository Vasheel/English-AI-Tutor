-- Create admin functions for the admin dashboard
-- These functions provide system statistics and user management

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
  topics_json JSONB;
BEGIN
  -- Get total users from profiles
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Get total sessions
  SELECT COUNT(*) INTO session_count FROM public.activity_sessions;
  
  -- Calculate total questions and accuracy
  SELECT 
    COALESCE(SUM(total_questions), 0),
    COALESCE(SUM(score), 0)
  INTO question_count, accuracy_sum
  FROM public.activity_sessions;
  
  -- Add questions from user_progress
  SELECT question_count + COALESCE(SUM(total_attempts), 0)
  INTO question_count
  FROM public.user_progress;
  
  -- Add questions from reading progress
  SELECT question_count + COALESCE(SUM(questions_answered), 0)
  INTO question_count
  FROM public.user_reading_progress;
  
  -- Calculate accuracy
  SELECT accuracy_sum + COALESCE(SUM(correct_answers), 0)
  INTO accuracy_sum
  FROM public.user_progress;
  
  SELECT accuracy_sum + COALESCE(SUM(questions_correct), 0)
  INTO accuracy_sum
  FROM public.user_reading_progress;
  
  -- Get popular topics
  SELECT jsonb_agg(
    jsonb_build_object('topic', activity_type, 'count', count)
  ) INTO topics_json
  FROM (
    SELECT activity_type, COUNT(*) as count
    FROM public.activity_sessions
    GROUP BY activity_type
    ORDER BY count DESC
    LIMIT 5
  ) topic_counts;
  
  -- Return the statistics
  RETURN QUERY SELECT
    user_count,
    0::BIGINT as active_users, -- Can't calculate without auth.users access
    question_count,
    session_count,
    CASE 
      WHEN question_count > 0 THEN (accuracy_sum / question_count) * 100
      ELSE 0
    END as average_accuracy,
    COALESCE(topics_json, '[]'::jsonb) as popular_topics,
    NOW() as last_updated;
END;
$$;

-- Function to get all users (for admin dashboard)
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
    NULL::TIMESTAMP WITH TIME ZONE as last_sign_in_at -- Not available in profiles
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
