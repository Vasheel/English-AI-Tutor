-- Create student_progress table for adaptive difficulty tracking
CREATE TABLE public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL, -- 'word_scramble', 'grammar', 'reading', etc.
  current_difficulty INTEGER DEFAULT 1 CHECK (current_difficulty >= 1 AND current_difficulty <= 3),
  accuracy DECIMAL(5,2) DEFAULT 0.00, -- percentage
  avg_response_time DECIMAL(8,2) DEFAULT 0.00, -- in seconds
  hints_used INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

-- Create question_history table to log each question attempt
CREATE TABLE public.question_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question_id TEXT, -- identifier for the specific question
  question_text TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time DECIMAL(8,2) NOT NULL, -- in seconds
  difficulty_level INTEGER NOT NULL,
  hints_used INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI question cache table
CREATE TABLE public.ai_question_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB, -- for multiple choice questions
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic, difficulty_level, question_text)
);

-- Enable Row Level Security
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_question_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_progress
CREATE POLICY "Users can view their own student progress" ON public.student_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own student progress" ON public.student_progress
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for question_history
CREATE POLICY "Users can view their own question history" ON public.question_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question history" ON public.question_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for ai_question_cache (public read, authenticated insert/update)
CREATE POLICY "Everyone can view AI question cache" ON public.ai_question_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage AI question cache" ON public.ai_question_cache
  FOR ALL TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_student_progress_user_topic ON public.student_progress(user_id, topic);
CREATE INDEX idx_question_history_user_topic ON public.question_history(user_id, topic);
CREATE INDEX idx_question_history_created_at ON public.question_history(created_at);
CREATE INDEX idx_ai_question_cache_topic_difficulty ON public.ai_question_cache(topic, difficulty_level);

-- Create function to update student progress with adaptive difficulty logic
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
  
  -- Calculate new values
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
  
  -- Update the record
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