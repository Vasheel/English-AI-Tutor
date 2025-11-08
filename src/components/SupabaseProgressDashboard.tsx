import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RefreshCw, Trash2, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProgressData {
  activity_type: string;
  total_attempts: number;
  correct_answers: number;
  total_time_spent: number;
}

const SupabaseProgressDashboard: React.FC = () => {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('No user found');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching progress:', fetchError);
        setError('Failed to fetch progress data');
      } else {
        setProgress(data || []);
        console.log('📊 Fetched progress data:', data);
      }
    } catch (error) {
      console.error('Error in fetchProgress:', error);
      setError('Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  };

  const resetProgress = async (activityType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return;
      }

      const { error: resetError } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('activity_type', activityType);

      if (resetError) {
        console.error('Error resetting progress:', resetError);
      } else {
        console.log(`✅ Reset progress for ${activityType}`);
        await fetchProgress();
      }
    } catch (error) {
      console.error('Error in resetProgress:', error);
    }
  };

  const resetAllProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return false;
      }

      console.log('🔄 Starting comprehensive progress reset for user:', user.id);
      
      // Delete all user progress
      const { error: progressError } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Delete all user badges
      const { error: badgesError } = await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;

      // Delete all activity sessions
      const { error: sessionsError } = await supabase
        .from('activity_sessions')
        .delete()
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      // Delete all student progress (for adaptive difficulty)
      const { error: studentProgressError } = await supabase
        .from('student_progress')
        .delete()
        .eq('user_id', user.id);

      if (studentProgressError) throw studentProgressError;

      // Delete all question history
      const { error: questionHistoryError } = await supabase
        .from('question_history')
        .delete()
        .eq('user_id', user.id);

      if (questionHistoryError) throw questionHistoryError;

      console.log('✅ All progress data reset successfully');
      
      // Refresh the progress data
      await fetchProgress();
      
      toast.success('All progress has been reset successfully! 🎉');
      return true;
      
    } catch (error) {
      console.error('❌ Error resetting progress:', error);
      toast.error('Failed to reset progress. Please try again.');
      return false;
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  // Calculate totals
  const totalAttempts = progress.reduce((sum, p) => sum + (p.total_attempts || 0), 0);
  const totalCorrect = progress.reduce((sum, p) => sum + (p.correct_answers || 0), 0);
  const totalTimeSpent = progress.reduce((sum, p) => sum + (p.total_time_spent || 0), 0);

  // Format time spent properly
  const formatTime = (seconds: number): string => {
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

  const formattedTime = formatTime(totalTimeSpent);
  
  // Calculate overall accuracy without capping at 100%
  const overallAccuracy = totalAttempts > 0 
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0;

  // Activity display name mapping - Updated to include ALL components
  const getActivityDisplayName = (activityType: string) => {
    const nameMap: { [key: string]: string } = {
      'grammar_exercises': 'Grammar Exercises',
      'word_scramble': 'Word Scramble', 
      'sentence_builder': 'Sentence Builder',
      'cloze': 'Close Test',
      'smart_quiz': 'Smart Quiz',
      'image_quiz': 'Image Quiz',
      'topic_questions': 'Topic Questions',
      'reading_comprehension': 'Reading Comprehension',
      // Legacy mappings for backward compatibility
      'quiz': 'Smart Quiz', // Map old 'quiz' to 'Smart Quiz'
      'reading': 'Reading Comprehension'
    };
    return nameMap[activityType] || activityType.replace('_', ' ').toUpperCase();
  };

  // Updated valid activities to include ALL components
  const validActivities = [
    'grammar_exercises', 
    'word_scramble', 
    'sentence_builder',
    'cloze',
    'smart_quiz',
    'image_quiz',
    'topic_questions',
    'reading_comprehension'
  ];
  
  // Include legacy 'quiz' activity and map it to smart_quiz for display
  const allValidActivities = [...validActivities, 'quiz', 'reading_comprehension'];
  const filteredProgress = progress.filter(p => allValidActivities.includes(p.activity_type));

  // Create a complete list of all expected activities with zero values for missing ones
  const completeActivityList = validActivities.map(activity => {
    const existingProgress = filteredProgress.find(p => 
      p.activity_type === activity || (activity === 'smart_quiz' && p.activity_type === 'quiz')
    );
    
    return existingProgress || {
      activity_type: activity,
      total_attempts: 0,
      correct_answers: 0,
      total_time_spent: 0
    };
  });

  console.log('📈 Calculated dashboard stats:', {
    totalAttempts,
    totalCorrect,
    overallAccuracy,
    formattedTime,
    filteredProgress,
    completeActivityList
  });

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setIsLoading(true);
    await fetchProgress();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading progress...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-600">
        <p className="mb-4">Error: {error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <CardTitle className="text-xl font-semibold text-gray-800">
              Your Learning Dashboard
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Progress</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reset all your progress? This action will permanently delete:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All activity progress and statistics</li>
                      <li>All earned badges and achievements</li>
                      <li>All session history and time tracking</li>
                      <li>All adaptive difficulty progress</li>
                      <li>All question history</li>
                    </ul>
                    <strong className="text-red-600">This action cannot be undone!</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const success = await resetAllProgress();
                      if (success) {
                        // Refresh the dashboard
                        window.location.reload();
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Track your progress and celebrate your achievements!
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Debug Panel - Can be removed in production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-yellow-800 flex items-center gap-1">
              🐛 Debug Panel
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Button 
              onClick={handleRefresh}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh Data
            </Button>
            <Button 
              onClick={resetAllProgress}
              className="bg-red-500 hover:bg-red-600 text-white"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Reset All Progress
            </Button>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{totalCorrect}</div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className={`text-2xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
              {overallAccuracy}%
            </div>
            <div className="text-sm text-gray-600">Overall Accuracy</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{formattedTime}</div>
            <div className="text-sm text-gray-600">Minutes Practiced</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{totalAttempts}</div>
            <div className="text-sm text-gray-600">Attempts</div>
          </div>
        </div>

        {/* Individual Activity Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completeActivityList.map((activity) => {
            // Special accuracy calculation for smart quiz
            let accuracy = 0;
            if (activity.activity_type === 'smart_quiz') {
              // For smart quiz: attempts = quiz sessions, correct = total correct questions
              const questionsPerQuiz = 5; // Assuming 5 questions per quiz
              const totalQuestions = activity.total_attempts * questionsPerQuiz;
              accuracy = totalQuestions > 0 ? Math.round((activity.correct_answers / totalQuestions) * 100) : 0;
            } else {
              // Default calculation for other activities
              accuracy = activity.total_attempts > 0 
                ? Math.round((activity.correct_answers / activity.total_attempts) * 100)
                : 0;
            }
            
            const timeDisplay = formatTime(activity.total_time_spent || 0);

            return (
              <div key={activity.activity_type} className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800">
                    {getActivityDisplayName(activity.activity_type)}
                  </h3>
                  <Badge 
                    variant={accuracy >= 80 ? "default" : accuracy >= 60 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {accuracy}%
                  </Badge>
                </div>
                
                <Progress value={accuracy} className="mb-3" />
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Attempts: {activity.total_attempts}</div>
                  <div>Correct: {activity.correct_answers}</div>
                </div>
                
                {activity.total_time_spent > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Time: {timeDisplay}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Show message if no progress data */}
        {completeActivityList.every(activity => activity.total_attempts === 0) && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No progress data yet</p>
            <p className="text-sm">
              Start practicing with any of the available exercises to see your progress here!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseProgressDashboard;