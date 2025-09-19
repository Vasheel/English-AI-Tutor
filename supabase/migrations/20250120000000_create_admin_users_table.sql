-- Create admin_users table for role-based access control
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

-- Create RLS policies for admin_users
-- Allow users to check if they are admins (for authentication purposes)
CREATE POLICY "Users can check their own admin status" ON public.admin_users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow super admins to manage admin users (but not check their own status to avoid recursion)
CREATE POLICY "Super admins can manage other admin users" ON public.admin_users
  FOR ALL TO authenticated USING (
    auth.uid() != user_id AND -- Don't allow users to manage themselves
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'super_admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_admin_users_role ON public.admin_users(role);

-- Insert your super admin user (replace with your actual user ID and email)
-- You'll need to get your user ID from the auth.users table first
-- This is a template - you need to replace the UUID and email with your actual values
-- INSERT INTO public.admin_users (user_id, email, role, permissions) VALUES
--   ('YOUR_USER_ID_HERE', 'your-email@example.com', 'super_admin', ARRAY['read', 'write', 'delete', 'manage_users', 'view_analytics', 'export_data', 'modify_system']);

-- Create a function to check if a user is an admin
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

-- Create a function to check if a user is a super admin
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
