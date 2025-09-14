-- Fix security issues with user data access (corrected version)

-- 1. Fix profiles table RLS policies
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create restrictive RLS policies for profiles table
-- Users can only view their own profile data
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile only" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (auth.uid() = id);

-- 2. Secure word_scramble_analytics table (the view will inherit RLS from this table)
-- Ensure word_scramble_analytics table is properly secured
DROP POLICY IF EXISTS "Users can manage their own analytics" ON public.word_scramble_analytics;

-- Create comprehensive RLS policies for word_scramble_analytics
CREATE POLICY "Users can view own analytics only" 
ON public.word_scramble_analytics 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own analytics only" 
ON public.word_scramble_analytics 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own analytics only" 
ON public.word_scramble_analytics 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own analytics only" 
ON public.word_scramble_analytics 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- 3. Ensure all user-related tables have proper RLS
-- Fix activity_sessions table policies
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.activity_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.activity_sessions;

CREATE POLICY "Users can view own sessions only" 
ON public.activity_sessions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions only" 
ON public.activity_sessions 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions only" 
ON public.activity_sessions 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions only" 
ON public.activity_sessions 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- 4. Secure other user-related tables
-- Fix user_progress table policies
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;

CREATE POLICY "Users can view own progress only" 
ON public.user_progress 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress only" 
ON public.user_progress 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress only" 
ON public.user_progress 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own progress only" 
ON public.user_progress 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());