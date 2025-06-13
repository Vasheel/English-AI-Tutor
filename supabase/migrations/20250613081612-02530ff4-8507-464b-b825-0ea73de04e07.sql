
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  grade_level INTEGER DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT, -- 'grammar', 'games', 'reading', 'quiz'
  requirement_type TEXT, -- 'score', 'streak', 'completion'
  requirement_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user badges (many-to-many relationship)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'grammar', 'word_scramble', 'sentence_builder', 'reading', 'quiz'
  total_attempts INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in minutes
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_type)
);

-- Create activity sessions table for detailed tracking
CREATE TABLE public.activity_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent INTEGER NOT NULL, -- in seconds
  difficulty_level INTEGER DEFAULT 1,
  session_data JSONB, -- store specific session details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reading passages table
CREATE TABLE public.reading_passages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT,
  difficulty_level INTEGER DEFAULT 1,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reading comprehension questions
CREATE TABLE public.comprehension_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passage_id UUID NOT NULL REFERENCES public.reading_passages(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'cloze', 'short_answer'
  correct_answer TEXT NOT NULL,
  options JSONB, -- for multiple choice questions
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user reading progress
CREATE TABLE public.user_reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  passage_id UUID NOT NULL REFERENCES public.reading_passages(id) ON DELETE CASCADE,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, passage_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprehension_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for activity_sessions
CREATE POLICY "Users can view their own sessions" ON public.activity_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.activity_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for reading passages (public read, authenticated create)
CREATE POLICY "Everyone can view reading passages" ON public.reading_passages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create passages" ON public.reading_passages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Create RLS policies for comprehension questions
CREATE POLICY "Everyone can view comprehension questions" ON public.comprehension_questions
  FOR SELECT TO authenticated USING (true);

-- Create RLS policies for user reading progress
CREATE POLICY "Users can view their own reading progress" ON public.user_reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reading progress" ON public.user_reading_progress
  FOR ALL USING (auth.uid() = user_id);

-- Badges table is public read
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view badges" ON public.badges
  FOR SELECT TO authenticated USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some initial badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value) VALUES
  ('First Steps', 'Complete your first grammar correction', '🏃', 'grammar', 'completion', 1),
  ('Grammar Rookie', 'Get 5 grammar corrections right', '📝', 'grammar', 'score', 5),
  ('Grammar Expert', 'Get 25 grammar corrections right', '🎓', 'grammar', 'score', 25),
  ('Word Wizard', 'Complete 10 word scramble games', '🔤', 'games', 'completion', 10),
  ('Sentence Master', 'Complete 10 sentence builder games', '📚', 'games', 'completion', 10),
  ('Reading Explorer', 'Complete your first reading passage', '🗺️', 'reading', 'completion', 1),
  ('Quiz Champion', 'Score 80% or higher on 5 quizzes', '🏆', 'quiz', 'score', 5),
  ('Streak Master', 'Maintain a 7-day learning streak', '🔥', 'general', 'streak', 7),
  ('Dedicated Learner', 'Spend 60 minutes learning', '⏰', 'general', 'time', 60);
