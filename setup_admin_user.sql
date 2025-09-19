-- Script to set up your admin user
-- Run this in your Supabase SQL editor after creating the admin_users table

-- Step 1: Find your user ID (replace 'your-email@example.com' with your actual email)
-- SELECT id, email FROM auth.users WHERE email = 'vasheel.ramchurn@umail.uom.ac.mu';

-- Step 2: Insert yourself as a super admin (replace the UUID and email with your actual values)
-- INSERT INTO public.admin_users (user_id, email, role, permissions) VALUES
--   ('eee65894-d22e-49bd-baee-f6f6cca510fe', 'vasheel.ramchurn@umail.uom.ac.mu', 'super_admin', 
--    ARRAY['read', 'write', 'delete', 'manage_users', 'view_analytics', 'export_data', 'modify_system']);

-- Step 3: Verify the admin user was created
-- SELECT * FROM public.admin_users WHERE email = 'vasheel.ramchurn@umail.uom.ac.mu';

-- Alternative: If you want to make any user with 'admin' in their email an admin
-- This will work with the current fallback logic in useAdminAuth.ts
-- UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb 
-- WHERE email LIKE '%admin%';
