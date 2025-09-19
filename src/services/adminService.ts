import { createClient } from '@supabase/supabase-js';

// Check if service role key is available
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!serviceRoleKey) {
  console.warn('VITE_SUPABASE_SERVICE_ROLE_KEY not found. Admin functions will not work.');
}

// Service role client for admin operations
// This should only be used server-side or in secure admin contexts
const supabaseAdmin = serviceRoleKey ? createClient(
  supabaseUrl!,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active?: boolean;
  total_sessions?: number;
  total_time_spent?: number;
}

export interface UserAnalytics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  new_users_today: number;
  new_users_this_week: number;
  total_sessions: number;
  total_time_spent: number;
  average_session_time: number;
}

export class AdminService {
  // Get all users with enhanced data
  static async getUsers(): Promise<AdminUser[]> {
    if (!supabaseAdmin) {
      throw new Error('Admin service not available. Please check your environment variables.');
    }

    try {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, username, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // Get auth users for last sign in data
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.warn('Could not fetch auth users:', authError.message);
      }

      // Get user sessions for activity data
      const { data: sessions, error: sessionsError } = await supabaseAdmin
        .from('activity_sessions')
        .select('*');

      if (sessionsError) {
        console.warn('Could not fetch sessions:', sessionsError.message);
      }

      // Combine data
      const formattedUsers: AdminUser[] = profiles?.map((profile) => {
        const authUser = authUsers?.users?.find(u => u.id === profile.id);
        const userSessions = sessions?.filter(s => s.user_id === profile.id) || [];
        const totalTime = userSessions.reduce((sum, session) => sum + (session.time_spent || 0), 0);
        
        return {
          id: profile.id,
          email: profile.email || '',
          created_at: profile.created_at || new Date().toISOString(),
          last_sign_in_at: authUser?.last_sign_in_at,
          is_active: authUser?.last_sign_in_at ? 
            (new Date().getTime() - new Date(authUser.last_sign_in_at).getTime()) < (24 * 60 * 60 * 1000) : false,
          total_sessions: userSessions.length,
          total_time_spent: totalTime
        };
      }) || [];
      
      return formattedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get analytics data
  static async getAnalytics(): Promise<UserAnalytics> {
    if (!supabaseAdmin) {
      throw new Error('Admin service not available. Please check your environment variables.');
    }

    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get user counts
      const { data: allUsers } = await supabaseAdmin
        .from('profiles')
        .select('id, created_at');
      
      const { data: sessions } = await supabaseAdmin
        .from('activity_sessions')
        .select('*');
      
      const totalUsers = allUsers?.length || 0;
      const newUsersToday = allUsers?.filter(u => 
        new Date(u.created_at).toDateString() === today.toDateString()
      ).length || 0;
      
      const newUsersThisWeek = allUsers?.filter(u => 
        new Date(u.created_at) >= weekAgo
      ).length || 0;
      
      const totalSessions = sessions?.length || 0;
      const totalTimeSpent = sessions?.reduce((sum, s) => sum + (s.time_spent || 0), 0) || 0;
      const averageSessionTime = totalSessions > 0 ? totalTimeSpent / totalSessions : 0;
      
      // Count active users (signed in within last 24 hours)
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const activeUsers = authUsers?.users?.filter(u => 
        u.last_sign_in_at && 
        (new Date().getTime() - new Date(u.last_sign_in_at).getTime()) < (24 * 60 * 60 * 1000)
      ).length || 0;
      
      return {
        total_users: totalUsers,
        active_users: activeUsers,
        inactive_users: totalUsers - activeUsers,
        new_users_today: newUsersToday,
        new_users_this_week: newUsersThisWeek,
        total_sessions: totalSessions,
        total_time_spent: totalTimeSpent,
        average_session_time: averageSessionTime
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Delete user (admin only)
  static async deleteUser(userId: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Admin service not available. Please check your environment variables.');
    }

    try {
      // Delete from auth using admin API
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Error deleting user from auth:', authError);
        throw new Error(`Failed to delete user: ${authError.message}`);
      }

      // Delete from profiles (should cascade)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        // Don't throw here as auth deletion succeeded
      }

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get user progress data
  static async getUserProgress() {
    if (!supabaseAdmin) {
      throw new Error('Admin service not available. Please check your environment variables.');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('user_progress')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  // Get individual user's progress data
  static async getUserProgressData(userId: string) {
    if (!supabaseAdmin) {
      throw new Error('Admin service not available. Please check your environment variables.');
    }

    try {
      // Get user progress from user_progress table
      const { data: progressData, error: progressError } = await supabaseAdmin
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (progressError) {
        throw progressError;
      }

      // Get activity sessions from activity_sessions table
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from('activity_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (sessionError) {
        throw sessionError;
      }

      // Get user profile information
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, username, created_at')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Could not fetch user profile:', profileError.message);
      }

      // Get auth user data for last sign in
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.id === userId);

      return {
        user: {
          id: userId,
          email: profileData?.email || 'Unknown',
          username: profileData?.username || profileData?.email?.split('@')[0] || 'Unknown',
          created_at: profileData?.created_at || new Date().toISOString(),
          last_sign_in_at: authUser?.last_sign_in_at,
          is_active: authUser?.last_sign_in_at ? 
            (new Date().getTime() - new Date(authUser.last_sign_in_at).getTime()) < (24 * 60 * 60 * 1000) : false
        },
        progress: progressData || [],
        sessions: sessionData || [],
        summary: {
          total_activities: progressData?.length || 0,
          total_sessions: sessionData?.length || 0,
          total_time_spent: sessionData?.reduce((sum, session) => sum + (session.time_spent || 0), 0) || 0,
          activities_completed: progressData?.filter(p => p.total_attempts > 0).length || 0,
          export_date: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching user progress data:', error);
      throw error;
    }
  }
}

export { supabaseAdmin };
