-- Fix security issue by recreating the word_scramble_performance view without SECURITY DEFINER
-- and ensuring it uses proper permissions

-- Drop the existing view
DROP VIEW IF EXISTS public.word_scramble_performance;

-- Recreate the view without SECURITY DEFINER (default is SECURITY INVOKER which is safer)
CREATE VIEW public.word_scramble_performance AS 
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
GROUP BY user_id;

-- Enable RLS on the view (views inherit RLS from underlying tables)
ALTER VIEW public.word_scramble_performance SET (security_invoker = on);

-- Fix function search_path issues for security
CREATE OR REPLACE FUNCTION public.update_student_progress_adaptive(p_user_id uuid, p_topic text, p_is_correct boolean, p_response_time numeric, p_hints_used integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_difficulty INTEGER;
  new_difficulty INTEGER;
  total_questions INTEGER;
  correct_answers INTEGER;
  current_accuracy DECIMAL;
BEGIN
  -- Get or create student progress record
  INSERT INTO student_progress (user_id, topic, current_difficulty, total_questions, correct_answers)
  VALUES (p_user_id, p_topic, 1, 0, 0)
  ON CONFLICT (user_id, topic) DO NOTHING;
  
  -- Get current stats
  SELECT 
    sp.current_difficulty,
    sp.total_questions,
    sp.correct_answers
  INTO 
    current_difficulty,
    total_questions,
    correct_answers
  FROM student_progress sp
  WHERE sp.user_id = p_user_id AND sp.topic = p_topic;
  
  -- Update totals
  total_questions := total_questions + 1;
  IF p_is_correct THEN
    correct_answers := correct_answers + 1;
  END IF;
  
  -- Calculate accuracy
  current_accuracy := CASE 
    WHEN total_questions > 0 THEN (correct_answers::DECIMAL / total_questions::DECIMAL) * 100
    ELSE 0
  END;
  
  -- Adaptive difficulty logic
  new_difficulty := current_difficulty;
  
  -- Increase difficulty if performing well
  IF current_accuracy >= 85 AND p_response_time <= 20 AND current_difficulty < 3 THEN
    new_difficulty := current_difficulty + 1;
  -- Decrease difficulty if struggling
  ELSIF (current_accuracy <= 50 OR p_hints_used >= 3) AND current_difficulty > 1 THEN
    new_difficulty := current_difficulty - 1;
  END IF;
  
  -- Update student progress
  UPDATE student_progress 
  SET 
    current_difficulty = new_difficulty,
    accuracy = current_accuracy,
    avg_response_time = (COALESCE(avg_response_time * (total_questions - 1), 0) + p_response_time) / total_questions,
    hints_used = hints_used + p_hints_used,
    total_questions = total_questions,
    correct_answers = correct_answers,
    last_updated = NOW()
  WHERE user_id = p_user_id AND topic = p_topic;
  
  RETURN new_difficulty;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  
  -- Initialize progress for all activity types
  INSERT INTO public.user_progress (user_id, activity_type) VALUES
    (NEW.id, 'grammar'),
    (NEW.id, 'word_scramble'),
    (NEW.id, 'sentence_builder'),
    (NEW.id, 'reading'),
    (NEW.id, 'quiz');
    
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_word_scramble_leaderboard()
RETURNS TABLE(user_id uuid, display_name text, total_points integer, accuracy_percentage numeric, best_streak integer, total_words_attempted bigint, rank bigint)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    wsp.user_id,
    'User ' || SUBSTRING(wsp.user_id::text, 1, 8) as display_name,
    wsp.total_points::integer,
    wsp.accuracy_percentage,
    wsp.best_streak::integer,
    wsp.total_words_attempted,
    RANK() OVER (ORDER BY wsp.total_points DESC) as rank
  FROM word_scramble_performance wsp
  WHERE wsp.total_words_attempted >= 10
  ORDER BY wsp.total_points DESC
  LIMIT 100;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_word_usage_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE ai_word_cache
  SET 
    usage_count = usage_count + 1,
    last_used = NOW(),
    success_rate = (
      SELECT ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END)::DECIMAL, 2)
      FROM word_scramble_analytics
      WHERE word_id = NEW.word_id
    )
  WHERE id = NEW.word_id;
  
  RETURN NEW;
END;
$function$;