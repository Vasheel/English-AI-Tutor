import React, { useEffect } from 'react';
import { useSupabaseProgress } from '@/hooks/useSupabaseProgress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, TrendingUp, Clock, Star, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SupabaseProgressDashboard = () => {
  const { progress, badges, loading, fetchProgress, resetProgress, getProgressStats } = useSupabaseProgress();

  // Refresh progress data when component mounts
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Debug logging
  useEffect(() => {
    console.log('📊 Dashboard received progress data:', progress);
    console.log('🏆 Dashboard received badges:', badges);
  }, [progress, badges]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats for all activities first
  const totalAttempts = progress.reduce((sum, p) => sum + (p.total_attempts || 0), 0);
  const totalCorrect = progress.reduce((sum, p) => sum + (p.correct_answers || 0), 0);
  const totalTime = progress.reduce((sum, p) => sum + (p.total_time_spent || 0), 0);
  const totalTimeMinutes = Math.floor(totalTime / 60);
  const totalTimeSeconds = totalTime % 60;
  const formattedTime = totalTimeMinutes > 0 
    ? `${totalTimeMinutes}m ${totalTimeSeconds}s`
    : `${totalTimeSeconds}s`;
  
  // Calculate overall accuracy without capping at 100%
  const overallAccuracy = totalAttempts > 0 
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0;

  // Activity display name mapping
  const getActivityDisplayName = (activityType: string) => {
    const nameMap: { [key: string]: string } = {
      'quiz': 'Quizzes',
      'word_scramble': 'Word Scramble',
      'sentence_builder': 'Sentence Builder',
      'reading_comprehension': 'Reading',
      'grammar_exercises': 'Grammar Exercises'
    };
    return nameMap[activityType] || activityType.replace('_', ' ').toUpperCase();
  };

  // Filter activities for display but keep all data for calculations
  const validActivities = ['quiz', 'word_scramble', 'sentence_builder', 'reading_comprehension', 'grammar_exercises'];
  const filteredProgress = progress.filter(p => validActivities.includes(p.activity_type));

  console.log('📈 Calculated dashboard stats:', {
    totalAttempts,
    totalCorrect,
    overallAccuracy,
    formattedTime,
    filteredProgress
  });

  // Check for data corruption
  const corruptedActivities = progress.filter(p => 
    (p.correct_answers || 0) > (p.total_attempts || 0)
  );

  // Ensure we show all attempts, even if they're 0
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchProgress();
  };

  const handleResetQuiz = async () => {
    await resetProgress('quiz');
  };

  const handleResetAll = async () => {
    await resetProgress();
  };

  const resetActivityData = async (activityType: string) => {
    console.log(`🗑️ Resetting data for activity: ${activityType}`);
    await resetProgress(activityType);
    await fetchProgress(); // Re-fetch to update progress state
  };

  const resetAllData = async () => {
    console.log('🗑️ Resetting all data');
    await resetProgress();
    await fetchProgress(); // Re-fetch to update progress state
  };

  const hasCorruption = corruptedActivities.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">📊 Your Learning Dashboard</h1>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <p className="text-gray-600">Track your progress and celebrate your achievements!</p>
      </div>

      {/* Debug Panel */}
      {(process.env.NODE_ENV === 'development' || hasCorruption) && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">🔧 Debug Panel</h4>
          
          {hasCorruption && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
              <h5 className="font-medium text-red-800 mb-2">⚠️ Data Corruption Detected!</h5>
              <p className="text-sm text-red-700 mb-2">The following activities have more correct answers than attempts:</p>
              <ul className="text-sm text-red-700 space-y-1">
                {corruptedActivities.map(activity => (
                  <li key={activity.activity_type} className="flex justify-between items-center">
                    <span>• {activity.activity_type}: {activity.correct_answers} correct > {activity.total_attempts} attempts</span>
                    <button
                      onClick={() => resetActivityData(activity.activity_type)}
                      className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Reset
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={handleRefresh}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={resetAllData}
              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              🗑️ Reset All Progress
            </button>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalCorrect}</div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getAccuracyColor(overallAccuracy)}`}>{overallAccuracy}%</div>
            <div className="text-sm text-gray-600">Overall Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formattedTime}</div>
            <div className="text-sm text-gray-600">Minutes Practiced</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{totalAttempts}</div>
            <div className="text-sm text-gray-600">Attempts</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {validActivities.map(activity => {
          const activityProgress = filteredProgress.find(p => p.activity_type === activity);
          const activityAccuracy = activityProgress && activityProgress.total_attempts > 0 
            ? Math.round((activityProgress.correct_answers / activityProgress.total_attempts) * 100)
            : 0;

          return (
            <Card key={activity}>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{getActivityDisplayName(activity)}</h3>
                  <div className={`text-sm ${getAccuracyColor(activityAccuracy)}`}>
                    {activityAccuracy}%
                  </div>
                </div>
                <Progress value={activityAccuracy} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <div>Attempts: {activityProgress?.total_attempts || 0}</div>
                  <div>Correct: {activityProgress?.correct_answers || 0}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievements */}
      {badges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {badges.map((userBadge) => (
              <Card key={userBadge.id}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{userBadge.badge.icon}</div>
                  <h3 className="font-semibold mb-1">{userBadge.badge.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{userBadge.badge.description}</p>
                  <div className="text-xs text-gray-500">
                    Earned: {new Date(userBadge.earned_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseProgressDashboard;
