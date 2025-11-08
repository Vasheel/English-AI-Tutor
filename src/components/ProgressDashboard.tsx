import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TrendingUp, Target, Award, Trash2, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseProgress } from '@/hooks/useSupabaseProgress';
import { supabase } from '@/integrations/supabase/client';
import LiveTimeTracker from '@/components/LiveTimeTracker';

interface ActivityProgress {
  activity_type: string;
  total_attempts: number;
  correct_answers: number;
  total_time_spent: number;
  current_level: number;
  current_streak: number;
  best_streak: number;
}

const ProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const { progress: activityProgress, loading, fetchProgress, resetAllProgress } = useSupabaseProgress();

  // Format time helper function
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

      // Define all expected activities
      const allActivities = [
        'grammar_exercises',
        'word_scramble', 
        'sentence_builder',
        'cloze',
        'smart_quiz',
        'image_quiz',
        'topic_questions',
        'reading_comprehension',
        'psac_chat'
      ];

  // Activity display names
  const getActivityDisplayName = (activityType: string): string => {
    const nameMap: { [key: string]: string } = {
      'grammar_exercises': 'Grammar Exercises',
      'word_scramble': 'Word Scramble', 
      'sentence_builder': 'Sentence Builder',
      'cloze': 'Close Test',
      'smart_quiz': 'Smart Quiz',
      'image_quiz': 'Image Quiz',
      'topic_questions': 'Topic Questions',
      'reading_comprehension': 'Reading Comprehension',
      'psac_chat': 'PSAC Chat'
    };
    return nameMap[activityType] || activityType.replace('_', ' ').toUpperCase();
  };

  // Fetch user's activity progress - now handled by useSupabaseProgress hook
  const fetchActivityProgress = fetchProgress;

  const getAccuracyPercentage = (attempts: number, correct: number, activityType?: string): number => {
    if (attempts === 0) return 0;
    
    // Special handling for smart quiz
    if (activityType === 'smart_quiz') {
      // For smart quiz: attempts = quiz sessions, correct = total correct questions
      // Each quiz typically has 5 questions, so accuracy = correct / (attempts * 5)
      const questionsPerQuiz = 5; // Assuming 5 questions per quiz
      const totalQuestions = attempts * questionsPerQuiz;
      return totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    }
    
    // Default calculation for other activities
    return Math.round((correct / attempts) * 100);
  };

  // Calculate overall accuracy across all activities
  const getOverallAccuracy = (): number => {
    let totalQuestions = 0;
    let totalCorrect = 0;
    
    completeActivityProgress.forEach(activity => {
      if (activity.activity_type === 'smart_quiz') {
        // For smart quiz: each attempt is a quiz session with 5 questions
        const questionsPerQuiz = 5;
        totalQuestions += activity.total_attempts * questionsPerQuiz;
        totalCorrect += activity.correct_answers;
      } else if (!isTimeOnlyActivity(activity.activity_type)) {
        // For other activities: each attempt is 1 question
        totalQuestions += activity.total_attempts;
        totalCorrect += activity.correct_answers;
      }
      // Time-only activities don't contribute to accuracy
    });
    
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  };

  // Create a complete list with all activities, filling missing ones with zeros
  const completeActivityProgress = allActivities.map(activityType => {
    const existingActivity = activityProgress?.find(activity => activity.activity_type === activityType);
    return existingActivity || {
      activity_type: activityType,
      total_attempts: 0,
      correct_answers: 0,
      total_time_spent: 0,
      current_level: 1,
      current_streak: 0,
      best_streak: 0
    };
  });

  const getTotalTimeSpent = (): number => {
    return completeActivityProgress.reduce((total, activity) => total + activity.total_time_spent, 0);
  };

  const getTotalAttempts = (): number => {
    return completeActivityProgress.reduce((total, activity) => total + activity.total_attempts, 0);
  };

  const getTotalCorrect = (): number => {
    return completeActivityProgress.reduce((total, activity) => total + activity.correct_answers, 0);
  };

  // Check if activity should only show time (no scores/streaks)
  const isTimeOnlyActivity = (activityType: string): boolean => {
    return ['topic_questions', 'reading_comprehension', 'psac_chat'].includes(activityType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Time Tracker */}
      <LiveTimeTracker />

      {/* Reset Progress Section */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset All Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Progress</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset all your progress? This action will permanently delete:
                </AlertDialogDescription>
                <div className="mt-2">
                  <ul className="list-disc list-inside space-y-1">
                    <li>All activity progress and statistics</li>
                    <li>All earned badges and achievements</li>
                    <li>All session history and time tracking</li>
                    <li>All adaptive difficulty progress</li>
                    <li>All question history</li>
                  </ul>
                  <p className="mt-2">
                    <strong className="text-red-600">This action cannot be undone!</strong>
                  </p>
                </div>
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
        </CardContent>
      </Card>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getTotalAttempts()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Across all activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getOverallAccuracy()}%
            </div>
            <Progress 
              value={getOverallAccuracy()} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-600" />
              Learning Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatTime(getTotalTimeSpent())}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Total practice time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Progress</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={fetchActivityProgress} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completeActivityProgress.map((activity) => (
                <div key={activity.activity_type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">
                      {getActivityDisplayName(activity.activity_type)}
                    </h3>
                    <Badge variant="outline">
                      Level {activity.current_level}
                    </Badge>
                  </div>
                  
                  {isTimeOnlyActivity(activity.activity_type) ? (
                    // Time-only display for Reading Comprehension and Topic Questions
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {formatTime(activity.total_time_spent)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Time Spent Learning
                      </div>
                    </div>
                  ) : (
                    // Full display for other activities
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {activity.total_attempts}
                          </div>
                          <div className="text-sm text-gray-600">Attempts</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {activity.correct_answers}
                          </div>
                          <div className="text-sm text-gray-600">Correct</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {getAccuracyPercentage(activity.total_attempts, activity.correct_answers, activity.activity_type)}%
                          </div>
                          <div className="text-sm text-gray-600">Accuracy</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatTime(activity.total_time_spent)}
                          </div>
                          <div className="text-sm text-gray-600">Time Spent</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-gray-600">Current Streak: </span>
                            <span className="font-semibold">{activity.current_streak}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Best Streak: </span>
                            <span className="font-semibold">{activity.best_streak}</span>
                          </div>
                        </div>
                        
                        <Progress 
                          value={getAccuracyPercentage(activity.total_attempts, activity.correct_answers, activity.activity_type)} 
                          className="w-32" 
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressDashboard;