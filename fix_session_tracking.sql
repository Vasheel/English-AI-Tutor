-- Ensure user_sessions table exists for session tracking
-- Run this in your Supabase SQL Editor

-- Create user_sessions table if it doesn't exist
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;

-- Create RLS policies
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Add function to get user's total time today
CREATE OR REPLACE FUNCTION get_user_total_time_today(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(total_time_spent)
    FROM public.user_sessions
    WHERE user_id = p_user_id
    AND DATE(session_start) = CURRENT_DATE
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get user's current active session
CREATE OR REPLACE FUNCTION get_user_active_session(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  session_start TIMESTAMP WITH TIME ZONE,
  total_time_spent INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.session_start,
    us.total_time_spent,
    us.last_activity,
    us.is_active
  FROM public.user_sessions us
  WHERE us.user_id = p_user_id
  AND us.is_active = true
  ORDER BY us.session_start DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_total_time_today(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_active_session(UUID) TO authenticated;
