
import { useEffect, useState } from "react";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import { getProgress, updateProgress as updateLocalProgress } from "@/utils/progressTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, TrendingUp, Clock, Star, AlertCircle } from "lucide-react";

const IntegratedProgressTracker = () => {
  const { progress: supabaseProgress, badges, loading } = useSupabaseProgress();
  const [localProgress, setLocalProgress] = useState(null);

  useEffect(() => {
    setLocalProgress(getProgress());
  }, []);

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

  const getActivityProgress = (activityType: string) => {
    const activity = supabaseProgress.find(p => p.activity_type === activityType);
    if (!activity || activity.total_attempts === 0) return 0;
    return Math.round((activity.correct_answers / activity.total_attempts) * 100);
  };

  const getTotalStats = () => {
    const totalAttempts = supabaseProgress.reduce((sum, p) => sum + p.total_attempts, 0);
    const totalCorrect = supabaseProgress.reduce((sum, p) => sum + p.correct_answers, 0);
    const totalTime = supabaseProgress.reduce((sum, p) => sum + p.total_time_spent, 0);
    const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

    return { totalCorrect, overallAccuracy, totalTime, totalAttempts };
  };

  const { totalCorrect, overallAccuracy, totalTime } = getTotalStats();

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const activityDisplayNames = {
    'grammar': 'Grammar Correction',
    'word_scramble': 'Word Scramble',
    'sentence_builder': 'Sentence Builder',
    'reading': 'Reading Comprehension',
    'quiz': 'Practice Quizzes'
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Your Learning Dashboard</h1>
        <p className="text-gray-600">Track your progress and celebrate your achievements!</p>
      </div>

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
            <div className={`text-2xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
              {Math.round(overallAccuracy)}%
            </div>
            <div className="text-sm text-gray-600">Overall Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalTime}</div>
            <div className="text-sm text-gray-600">Minutes Practiced</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{badges.length}</div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supabaseProgress.map((p) => {
              const accuracy = p.total_attempts > 0 ? (p.correct_answers / p.total_attempts) * 100 : 0;
              return (
                <div key={p.activity_type}>
                  <div className="flex justify-between mb-2">
                    <span>{activityDisplayNames[p.activity_type] || p.activity_type}</span>
                    <span className="text-sm text-gray-600">
                      {p.correct_answers}/{p.total_attempts}
                    </span>
                  </div>
                  <Progress value={accuracy} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Level {p.current_level}</span>
                    <span>{Math.round(accuracy)}% accuracy</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {badges.map((userBadge) => (
                  <div key={userBadge.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">{userBadge.badge.icon}</div>
                    <div className="text-xs font-medium text-yellow-800">{userBadge.badge.name}</div>
                    <div className="text-xs text-yellow-600">{userBadge.badge.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Start practicing to earn achievements! 🌟
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Your Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supabaseProgress.filter(p => p.current_streak > 0 || p.best_streak > 0).map((p) => (
                <div key={p.activity_type} className="flex justify-between items-center">
                  <span className="font-medium">{activityDisplayNames[p.activity_type]}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-600">
                      🔥 {p.current_streak} current
                    </div>
                    <div className="text-xs text-gray-500">
                      Best: {p.best_streak}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {supabaseProgress.map((p) => (
                <div key={p.activity_type} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium">{activityDisplayNames[p.activity_type]}</div>
                    <div className="text-sm text-gray-600">
                      Last active: {new Date(p.last_activity).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Level {p.current_level}
                    </div>
                    <div className="text-xs text-gray-500">{p.total_time_spent}m total</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegratedProgressTracker;
