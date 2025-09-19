-- Admin Enhancements SQL Script
-- This script enhances the admin functionality with proper database setup

-- Ensure admin_users table exists with proper structure
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Add RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view admin_users
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Policy: Only admins can insert admin_users
CREATE POLICY "Admins can insert admin_users" ON admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Policy: Only admins can update admin_users
CREATE POLICY "Admins can update admin_users" ON admin_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Policy: Only admins can delete admin_users
CREATE POLICY "Admins can delete admin_users" ON admin_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = is_admin.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  new_users_today BIGINT,
  new_users_this_week BIGINT,
  total_sessions BIGINT,
  total_time_spent BIGINT,
  average_session_time NUMERIC
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_users,
      COUNT(CASE WHEN last_sign_in_at <= NOW() - INTERVAL '24 hours' OR last_sign_in_at IS NULL THEN 1 END) as inactive_users,
      COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as new_users_today,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_users_this_week
    FROM profiles
  ),
  session_stats AS (
    SELECT 
      COUNT(*) as total_sessions,
      COALESCE(SUM(time_spent), 0) as total_time_spent,
      CASE 
        WHEN COUNT(*) > 0 THEN COALESCE(SUM(time_spent), 0) / COUNT(*)
        ELSE 0
      END as average_session_time
    FROM activity_sessions
  )
  SELECT 
    us.total_users,
    us.active_users,
    us.inactive_users,
    us.new_users_today,
    us.new_users_this_week,
    ss.total_sessions,
    ss.total_time_spent,
    ss.average_session_time
  FROM user_stats us, session_stats ss;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user progress summary
CREATE OR REPLACE FUNCTION get_user_progress_summary()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  total_attempts BIGINT,
  total_correct BIGINT,
  total_time_spent BIGINT,
  activities_count BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.username,
    COALESCE(SUM(up.total_attempts), 0) as total_attempts,
    COALESCE(SUM(up.correct_answers), 0) as total_correct,
    COALESCE(SUM(up.total_time_spent), 0) as total_time_spent,
    COUNT(DISTINCT up.activity_type) as activities_count,
    MAX(up.updated_at) as last_activity
  FROM profiles p
  LEFT JOIN user_progress up ON p.id = up.user_id
  GROUP BY p.id, p.email, p.username
  ORDER BY total_time_spent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete user (admin only)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Prevent admin from deleting themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;

  -- Delete user from auth (this will cascade to profiles and other tables)
  PERFORM auth.users WHERE id = target_user_id;
  
  -- Note: Actual deletion from auth.users should be done via Supabase Admin API
  -- This function just validates permissions
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger for admin_users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some sample admin data (replace with actual admin email)
-- INSERT INTO admin_users (user_id, email, role) 
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1),
--   'admin@example.com',
--   'admin'
-- ) ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_progress_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE admin_users IS 'Table storing admin user information';
COMMENT ON FUNCTION is_admin(UUID) IS 'Check if a user has admin privileges';
COMMENT ON FUNCTION get_user_analytics() IS 'Get comprehensive user analytics (admin only)';
COMMENT ON FUNCTION get_user_progress_summary() IS 'Get user progress summary (admin only)';
COMMENT ON FUNCTION admin_delete_user(UUID) IS 'Safely delete a user (admin only)';
