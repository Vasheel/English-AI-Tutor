import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  created_at: string;
}

export const useAdminAuth = () => {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setAdminUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      console.log('Checking admin status for user:', user.email, 'ID:', user.id);
      
      // Try database functions first using a type-safe approach
      type SupabaseRPC = {
        rpc: (name: string, params?: Record<string, unknown>) => Promise<{
          data: unknown;
          error: { message: string; code?: string } | null;
        }>;
      };
      
      const supabaseRPC = supabase as unknown as SupabaseRPC;
      
      const { data: isAdminResult, error: adminError } = await supabaseRPC
        .rpc('is_admin_user', { p_user_id: user.id });

      const { data: isSuperAdminResult, error: superAdminError } = await supabaseRPC
        .rpc('is_super_admin_user', { p_user_id: user.id });

      if (adminError && adminError.code === '42883') {
        // Function doesn't exist error, create fallback
        console.warn('Admin functions not found, using fallback logic');
        
        const adminEmails = [
          'vasheel.ramchurn@umail.uom.ac.mu',
          'superadmin@example.com',
        ];
        
        const isEmailAdmin = adminEmails.includes(user.email || '') || 
                           user.email?.includes('admin') || 
                           user.user_metadata?.role === 'admin';

        if (isEmailAdmin) {
          console.log('Using fallback email-based admin check');
          setAdminUser({
            id: user.id,
            email: user.email || '',
            role: user.email?.includes('super') ? 'super_admin' : 'admin',
            permissions: user.email?.includes('super') ? 
              ['read', 'write', 'delete', 'manage_users', 'view_analytics', 'export_data', 'modify_system'] :
              ['read', 'write', 'view_analytics', 'export_data'],
            created_at: user.created_at || new Date().toISOString()
          });
          setIsAdmin(true);
          setIsSuperAdmin(user.email?.includes('super') || false);
        } else {
          setAdminUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } else if (adminError || superAdminError) {
        console.error('Admin function error:', adminError?.message || superAdminError?.message);
        throw new Error(adminError?.message || superAdminError?.message);
      } else if (isAdminResult === true) {
        // Database admin check successful
        console.log('Database admin check successful');
        
        setAdminUser({
          id: user.id,
          email: user.email || '',
          role: isSuperAdminResult === true ? 'super_admin' : 'admin',
          permissions: isSuperAdminResult === true ? 
            ['read', 'write', 'delete', 'manage_users', 'view_analytics', 'export_data', 'modify_system'] :
            ['read', 'write', 'view_analytics', 'export_data'],
          created_at: user.created_at || new Date().toISOString()
        });
        setIsAdmin(true);
        setIsSuperAdmin(isSuperAdminResult === true);
      } else {
        // User exists but is not admin
        console.log('User is not admin');
        setAdminUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('Failed to check admin status');
      setAdminUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;
    return adminUser.permissions.includes(permission) || 
           adminUser.permissions.includes('*') ||
           isSuperAdmin; // Super admins have all permissions
  };

  const canManageUsers = (): boolean => {
    return isSuperAdmin || hasPermission('manage_users');
  };

  const canViewAnalytics = (): boolean => {
    return isAdmin || hasPermission('view_analytics');
  };

  const canExportData = (): boolean => {
    return isAdmin || hasPermission('export_data');
  };

  const canModifySystem = (): boolean => {
    return isSuperAdmin || hasPermission('modify_system');
  };

  const canDeleteUsers = (): boolean => {
    return isSuperAdmin || hasPermission('delete');
  };

  const canCreateAdmins = (): boolean => {
    return isSuperAdmin;
  };

  return {
    adminUser,
    isAdmin,
    isSuperAdmin,
    loading,
    error,
    hasPermission,
    canManageUsers,
    canViewAnalytics,
    canExportData,
    canModifySystem,
    canDeleteUsers,
    canCreateAdmins,
    refreshAdminStatus: checkAdminStatus
  };
};