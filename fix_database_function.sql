-- SQL to fix the ambiguous column reference error
-- Run this in your Supabase SQL Editor to fix the database function

-- Drop the problematic function first
DROP FUNCTION IF EXISTS public.update_student_progress_adaptive(UUID, TEXT, BOOLEAN, DECIMAL, INTEGER);

-- Create the corrected function with explicit column references
CREATE OR REPLACE FUNCTION public.update_student_progress_adaptive(
  p_user_id UUID,
  p_topic TEXT,
  p_is_correct BOOLEAN,
  p_response_time DECIMAL,
  p_hints_used INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
DECLARE
  current_record RECORD;
  new_difficulty INTEGER;
  new_accuracy DECIMAL;
  new_avg_time DECIMAL;
  new_hints_used INTEGER;
  difficulty_changed BOOLEAN := FALSE;
BEGIN
  -- Get current progress
  SELECT * INTO current_record 
  FROM public.student_progress 
  WHERE user_id = p_user_id AND topic = p_topic;
  
  -- If no record exists, create one
  IF current_record IS NULL THEN
    INSERT INTO public.student_progress (
      user_id, topic, current_difficulty, accuracy, 
      avg_response_time, hints_used, total_questions, correct_answers
    ) VALUES (
      p_user_id, p_topic, 1, 
      CASE WHEN p_is_correct THEN 100.00 ELSE 0.00 END,
      p_response_time, p_hints_used, 1,
      CASE WHEN p_is_correct THEN 1 ELSE 0 END
    );
    RETURN 1;
  END IF;
  
  -- Calculate new values with explicit table references
  new_accuracy := (
    (current_record.correct_answers + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::DECIMAL / 
    (current_record.total_questions + 1)::DECIMAL * 100
  );
  
  new_avg_time := (
    (current_record.avg_response_time * current_record.total_questions + p_response_time) / 
    (current_record.total_questions + 1)
  );
  
  new_hints_used := current_record.hints_used + p_hints_used;
  
  -- Adaptive difficulty logic
  new_difficulty := current_record.current_difficulty;
  
  -- Increase difficulty if accuracy > 85% and avg time < 20s
  IF new_accuracy > 85.00 AND new_avg_time < 20.00 AND current_record.current_difficulty < 3 THEN
    new_difficulty := current_record.current_difficulty + 1;
    difficulty_changed := TRUE;
  END IF;
  
  -- Decrease difficulty if accuracy < 50% or hints used > 3
  IF (new_accuracy < 50.00 OR new_hints_used > 3) AND current_record.current_difficulty > 1 THEN
    new_difficulty := current_record.current_difficulty - 1;
    difficulty_changed := TRUE;
  END IF;
  
  -- Update the record with explicit column references
  UPDATE public.student_progress SET
    current_difficulty = new_difficulty,
    accuracy = new_accuracy,
    avg_response_time = new_avg_time,
    hints_used = new_hints_used,
    total_questions = current_record.total_questions + 1,
    correct_answers = current_record.correct_answers + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_updated = NOW()
  WHERE user_id = p_user_id AND topic = p_topic;
  
  -- Return the new difficulty level
  RETURN new_difficulty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
