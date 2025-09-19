-- Run this SQL in your Supabase SQL Editor to set up session tracking

-- Create user_sessions table for tracking user session time
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  total_time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON public.user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Fix existing activity_sessions table to prevent incorrect time values
-- Add constraints to prevent unrealistic time values
ALTER TABLE public.activity_sessions 
ADD CONSTRAINT check_time_spent_reasonable 
CHECK (time_spent >= 0 AND time_spent <= 86400); -- Max 24 hours per session

-- Update existing incorrect time values
UPDATE public.activity_sessions 
SET time_spent = LEAST(time_spent, 3600) -- Cap at 1 hour
WHERE time_spent > 3600;

-- Add function to get user's total time today
CREATE OR REPLACE FUNCTION get_user_time_today(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_time INTEGER;
BEGIN
  SELECT COALESCE(SUM(total_time_spent), 0)
  INTO total_time
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND DATE(session_start) = CURRENT_DATE;
  
  RETURN total_time;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_time_today(UUID) TO authenticated;
