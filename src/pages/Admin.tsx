import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminService, AdminUser, UserAnalytics } from '@/services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Shield, Search, RefreshCw, Download, BarChart3, Trash2, Eye, UserCheck, UserX, Calendar, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const Admin: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading, error: adminError } = useAdminAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, unknown>[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Enhanced function to fetch users with analytics
  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users...');
      const usersData = await AdminService.getUsers();
      setUsers(usersData);
      console.log('Users fetched successfully:', usersData.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error instanceof Error && error.message.includes('Admin service not available')) {
        toast.error('Admin service not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
        // Set empty users array so the page doesn't crash
        setUsers([]);
      } else {
        toast.error('Failed to fetch users');
      }
    }
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const analyticsData = await AdminService.getAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error instanceof Error && error.message.includes('Admin service not available')) {
        // Set default analytics so the page doesn't crash
        setAnalytics({
          total_users: 0,
          active_users: 0,
          inactive_users: 0,
          new_users_today: 0,
          new_users_this_week: 0,
          total_sessions: 0,
          total_time_spent: 0,
          average_session_time: 0
        });
      }
    }
  }, []);

  // Fetch user progress data
  const fetchUserProgress = useCallback(async () => {
    try {
      const progressData = await AdminService.getUserProgress();
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      if (error instanceof Error && error.message.includes('Admin service not available')) {
        // Set empty progress array so the page doesn't crash
        setUserProgress([]);
      }
    }
  }, []);

  // Delete user function
  const deleteUser = useCallback(async (userId: string) => {
    try {
      await AdminService.deleteUser(userId);
      toast.success('User deleted successfully');
      await fetchUsers();
      await fetchAnalytics();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error instanceof Error && error.message.includes('Admin service not available')) {
        toast.error('Admin service not configured. Cannot delete users.');
      } else {
        toast.error('Failed to delete user');
      }
    }
  }, [fetchUsers, fetchAnalytics]);

  // Export individual user progress data as PDF
  const exportUserProgress = useCallback(async (userId: string, userEmail: string) => {
    try {
      const userData = await AdminService.getUserProgressData(userId);
      
      const filename = `Student_Progress_Report_${userData.user.username}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Helper functions
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
          return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
          return `${minutes}m ${secs}s`;
        } else {
          return `${secs}s`;
        }
      };

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };

      const formatActivityName = (activityType: string) => {
        const nameMap: Record<string, string> = {
          'sentence_builder': 'Sentence Builder',
          'word_scramble': 'Word Scramble',
          'cloze': 'Close Test',
          'smart_quiz': 'Smart Quiz',
          'topic_questions': 'Topic Questions',
          'grammar_tutor': 'Grammar Tutor',
          'reading_comprehension': 'Reading Comprehension',
          'exercise_generator': 'Exercise Generator',
          'diagnostic_test': 'Diagnostic Test',
          'image_quiz': 'Image Quiz',
          'psac_chat': 'PSAC Chat'
        };
        return nameMap[activityType] || activityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      // Create PDF
      const doc = new jsPDF();
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(color);
        
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 5;
        
        return yPosition;
      };

      // Helper function to add line separator
      const addLine = () => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      };

      // Helper function to check if we need a new page
      const checkNewPage = () => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Title
      addText('STUDENT PROGRESS REPORT', 18, true, '#2c3e50');
      addLine();

      // Student Information Section
      addText('Student Information', 14, true, '#34495e');
      addText(`Name: ${userData.user.username}`, 12);
      addText(`Email: ${userData.user.email}`, 12);
      addText(`Joined: ${formatDate(userData.user.created_at)}`, 12);
      addText(`Last Active: ${userData.user.last_sign_in_at ? formatDate(userData.user.last_sign_in_at) : 'Never'}`, 12);
      addText(`Status: ${userData.user.is_active ? 'Active' : 'Inactive'}`, 12);
      addLine();

      // Overall Summary Section
      addText('Overall Summary', 14, true, '#34495e');
      addText(`Total Activities Attempted: ${userData.summary.total_activities}`, 12);
      addText(`Activities Completed: ${userData.summary.activities_completed}`, 12);
      addText(`Total Learning Sessions: ${userData.summary.total_sessions}`, 12);
      addText(`Total Time Spent: ${formatTime(userData.summary.total_time_spent)}`, 12);
      addText(`Report Generated: ${formatDate(userData.summary.export_date)}`, 12);
      addLine();

      // Detailed Activity Progress Section
      addText('Detailed Activity Progress', 14, true, '#34495e');
      
      if (userData.progress.length > 0) {
        userData.progress.forEach((activity: any) => {
          checkNewPage();
          addText(`${formatActivityName(activity.activity_type)}:`, 12, true, '#2980b9');
          addText(`• Total Attempts: ${activity.total_attempts || 0}`, 11);
          addText(`• Correct Answers: ${activity.correct_answers || 0}`, 11);
          addText(`• Accuracy: ${activity.total_attempts > 0 ? Math.round((activity.correct_answers / activity.total_attempts) * 100) : 0}%`, 11);
          addText(`• Time Spent: ${formatTime(activity.total_time_spent || 0)}`, 11);
          addText(`• Current Streak: ${activity.current_streak || 0}`, 11);
          addText(`• Best Streak: ${activity.best_streak || 0}`, 11);
          addText(`• Last Updated: ${formatDate(activity.updated_at)}`, 11);
          yPosition += 5;
        });
      } else {
        addText('No activity progress recorded yet.', 12);
      }
      
      addLine();

      // Recent Learning Sessions Section
      if (userData.sessions.length > 0) {
        addText('Recent Learning Sessions', 14, true, '#34495e');
        userData.sessions.slice(0, 10).forEach((session: any, index: number) => {
          checkNewPage();
          addText(`${index + 1}. ${formatActivityName(session.activity_type)} - ${formatTime(session.time_spent || 0)} (${formatDate(session.created_at)})`, 11);
        });
        
        if (userData.sessions.length > 10) {
          addText(`... and ${userData.sessions.length - 10} more sessions`, 11);
        }
      }

      // Footer
      checkNewPage();
      addLine();
      addText(`This report was generated on ${formatDate(userData.summary.export_date)}.`, 10, false, '#7f8c8d');
      addText('For questions about this report, please contact your teacher or administrator.', 10, false, '#7f8c8d');

      // Save the PDF
      doc.save(filename);
      
      toast.success(`Progress report exported as PDF for ${userData.user.username}`);
    } catch (error) {
      console.error('Error exporting user progress:', error);
      toast.error('Failed to export user progress data');
    }
  }, []);

  // Export data function
  const exportData = useCallback(async (type: 'users' | 'analytics' | 'progress') => {
    try {
      let data: AdminUser[] | UserAnalytics | Record<string, unknown>[];
      let filename: string;
      
      switch (type) {
        case 'users':
          data = users;
          filename = `users_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'analytics':
          data = analytics;
          filename = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'progress':
          data = userProgress;
          filename = `progress_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          return;
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  }, [users, analytics, userProgress]);

  // Load all data when component mounts
  useEffect(() => {
    if (adminLoading) return;
    
    if (adminError) {
      toast.error(`Admin check failed: ${adminError}`);
      return;
    }
    
    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
    
    setLoading(true);
    Promise.all([
      fetchUsers(),
      fetchAnalytics(),
      fetchUserProgress()
    ]).finally(() => setLoading(false));
  }, [isAdmin, adminLoading, adminError, navigate, fetchUsers, fetchAnalytics, fetchUserProgress]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUsers(),
      fetchAnalytics(),
      fetchUserProgress()
    ]);
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage users, view analytics, and export data</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => signOut()} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.total_users}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.active_users}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  New This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.new_users_this_week}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  New registrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Total Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.total_sessions}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Learning sessions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuration Warning */}
        {!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Service Not Configured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700 mb-4">
                To enable full admin functionality (user deletion, analytics, etc.), you need to add the Supabase Service Role Key to your environment variables.
              </p>
              <div className="bg-yellow-100 p-3 rounded border">
                <p className="text-sm font-mono text-yellow-800">
                  Add to your .env file:<br/>
                  VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
                </p>
              </div>
              <p className="text-sm text-yellow-600 mt-2">
                Get your service role key from Supabase Dashboard → Settings → API
              </p>
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => exportData('users')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </Button>
              <Button onClick={() => exportData('analytics')} variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Analytics
              </Button>
              <Button onClick={() => exportData('progress')} variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Export Progress
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="progress">Progress Data</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Badge variant="outline">
                      {filteredUsers.length} of {users.length} users
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.email.split('@')[0]}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div>{user.total_sessions || 0} sessions</div>
                              <div className="text-gray-500">
                                {Math.floor((user.total_time_spent || 0) / 60)}m total
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDetails(true);
                                }}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportUserProgress(user.id, user.email)}
                                title="Export Progress Data"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" title="Delete User">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.email}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Active Users (24h)</span>
                      <span className="font-semibold">{analytics?.active_users || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inactive Users</span>
                      <span className="font-semibold">{analytics?.inactive_users || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Users Today</span>
                      <span className="font-semibold">{analytics?.new_users_today || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Users This Week</span>
                      <span className="font-semibold">{analytics?.new_users_this_week || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Sessions</span>
                      <span className="font-semibold">{analytics?.total_sessions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Time Spent</span>
                      <span className="font-semibold">
                        {Math.floor((analytics?.total_time_spent || 0) / 3600)}h {Math.floor(((analytics?.total_time_spent || 0) % 3600) / 60)}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Session Time</span>
                      <span className="font-semibold">
                        {Math.floor((analytics?.average_session_time || 0) / 60)}m
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>User Progress Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attempts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Correct
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Streak
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userProgress.map((progress, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(progress.user_id as string)?.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(progress.activity_type as string)?.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {progress.total_attempts as number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {progress.correct_answers as number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Math.floor((progress.total_time_spent as number) / 60)}m
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {progress.current_streak as number} / {progress.best_streak as number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p className="text-sm">{selectedUser.email.split('@')[0]}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Joined</label>
                    <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Sign In</label>
                    <p className="text-sm">
                      {selectedUser.last_sign_in_at 
                        ? new Date(selectedUser.last_sign_in_at).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Sessions</label>
                    <p className="text-sm">{selectedUser.total_sessions || 0}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Time Spent</label>
                  <p className="text-sm">
                    {Math.floor((selectedUser.total_time_spent || 0) / 3600)}h {Math.floor(((selectedUser.total_time_spent || 0) % 3600) / 60)}m
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;