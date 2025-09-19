-- Test script to verify admin setup
-- Run this in Supabase SQL Editor to check if everything is working

-- 1. Check if the admin_users table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'admin_users';

-- 2. Check if your user exists in admin_users table
SELECT * FROM public.admin_users WHERE email = 'vasheel.ramchurn@umail.uom.ac.mu';

-- 3. Test the admin functions
SELECT public.is_admin_user('eee65894-d22e-49bd-baee-f6f6cca510fe') as is_admin;
SELECT public.is_super_admin_user('eee65894-d22e-49bd-baee-f6f6cca510fe') as is_super_admin;

-- 4. Check if the functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin_user', 'is_super_admin_user');

-- 5. Check RLS policies on admin_users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin_users';
