-- Fix the infinite recursion issue in admin_users table
-- Drop existing policies and recreate with simpler logic

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check their own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage other admin users" ON public.admin_users;

-- Drop the table if it exists to start fresh
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Recreate admin_users table with simpler approach
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
  permissions TEXT[] DEFAULT ARRAY['read', 'write'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow users to check their own admin status
CREATE POLICY "Users can check own admin status" ON public.admin_users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Simple policy: Allow service role to manage all admin users
CREATE POLICY "Service role can manage admin users" ON public.admin_users
  FOR ALL TO service_role USING (true);

-- Create indexes for better performance
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_admin_users_role ON public.admin_users(role);

-- Insert your super admin user directly (bypassing RLS)
-- This will be executed with elevated privileges
INSERT INTO public.admin_users (user_id, email, role, permissions) VALUES
  ('eee65894-d22e-49bd-baee-f6f6cca510fe', 'vasheel.ramchurn@umail.uom.ac.mu', 'super_admin', 
   ARRAY['read', 'write', 'delete', 'manage_users', 'view_analytics', 'export_data', 'modify_system']);

-- Create a function to check if a user is an admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = p_user_id 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is a super admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = p_user_id 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
