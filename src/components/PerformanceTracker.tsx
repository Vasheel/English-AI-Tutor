import React, { useState, useEffect, useCallback } from 'react';
import { useAdaptiveDifficulty } from '@/hooks/useAdaptiveDifficulty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, TrendingUp, Lightbulb } from 'lucide-react';

interface PerformanceTrackerProps {
  topic: string;
  showDetails?: boolean;
  className?: string;
}

const PerformanceTracker: React.FC<PerformanceTrackerProps> = ({ 
  topic, 
  showDetails = true,
  className = "" 
}) => {
  const {
    currentProgress,
    loading,
    currentDifficulty,
    accuracy,
    avgResponseTime,
    fetchProgress
  } = useAdaptiveDifficulty(topic);

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'text-green-600';
      case 2: return 'text-yellow-600';
      case 3: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 85) return 'text-green-600';
    if (acc >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimeColor = (time: number) => {
    if (time <= 15) return 'text-green-600';
    if (time <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-600" />
          Performance Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Difficulty */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Current Level</span>
          </div>
          <div className={`font-bold ${getDifficultyColor(currentDifficulty)}`}>
            {getDifficultyLabel(currentDifficulty)} ({currentDifficulty}/3)
          </div>
        </div>

        {/* Accuracy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Accuracy</span>
            </div>
            <span className={`font-bold ${getAccuracyColor(accuracy)}`}>
              {accuracy.toFixed(1)}%
            </span>
          </div>
          <Progress value={accuracy} className="h-2" />
        </div>

        {/* Average Response Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Avg Time</span>
          </div>
          <span className={`font-bold ${getTimeColor(avgResponseTime)}`}>
            {avgResponseTime.toFixed(1)}s
          </span>
        </div>

        {showDetails && currentProgress && (
          <>
            {/* Total Questions */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Questions</span>
              <span className="font-medium">{currentProgress.total_questions}</span>
            </div>

            {/* Correct Answers */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Correct Answers</span>
              <span className="font-medium text-green-600">
                {currentProgress.correct_answers}
              </span>
            </div>

            {/* Hints Used */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-gray-600">Hints Used</span>
              </div>
              <span className="font-medium text-yellow-600">
                {currentProgress.hints_used}
              </span>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              Last updated: {new Date(currentProgress.last_updated).toLocaleDateString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceTracker; 