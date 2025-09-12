// src/components/ProgressCircle.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, TrendingUp, Star, Zap, Crown, Rocket } from 'lucide-react';

interface ProgressDashboardProps {
  progress: {
    averageAccuracy: number;
    currentStreak: number;
    bestStreak: number;
    averageSpeed: number;
    levelProgress: {
      easy: { completed: number; total: number; accuracy: number };
      medium: { completed: number; total: number; accuracy: number };
      hard: { completed: number; total: number; accuracy: number };
    };
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    easyAccuracy: number;
    mediumAccuracy: number;
    hardAccuracy: number;
    easyCompleted: number;
    easyTotal: number;
    mediumCompleted: number;
    mediumTotal: number;
    hardCompleted: number;
    hardTotal: number;
    badges: string[];
    completedSentences: number;
  };
}

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  animated?: boolean;
  type?: 'solid' | 'segmented' | 'concentric';
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  children,
  animated = true,
  type = 'solid'
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  const getSegmentedPath = () => {
    const segments = 20; // Number of segments
    const segmentAngle = 360 / segments;
    const paths = [];
    
    for (let i = 0; i < segments; i++) {
      const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
      
      const x1 = size / 2 + radius * Math.cos(startAngle);
      const y1 = size / 2 + radius * Math.sin(startAngle);
      const x2 = size / 2 + radius * Math.cos(endAngle);
      const y2 = size / 2 + radius * Math.sin(endAngle);
      
      const isActive = (i / segments) * 100 <= animatedPercentage;
      
      paths.push(
        <path
          key={i}
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke={isActive ? color : backgroundColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
    }
    return paths;
  };

  if (type === 'segmented') {
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {getSegmentedPath()}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  if (type === 'concentric') {
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Outer ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          {/* Inner ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth - 4}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth - 2}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth - 4}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth - 2}
            strokeDasharray={strokeDasharray * 0.7}
            strokeDashoffset={strokeDashoffset * 0.7}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  // Default solid type
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export function ProgressDashboard({ progress }: ProgressDashboardProps) {
  // Safety check - if progress is not properly initialized, show a loading state
  if (!progress || !progress.levelProgress) {
    return (
      <div className="space-y-6 p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Your Progress Dashboard</h2>
          <div className="text-lg font-semibold text-blue-600 animate-pulse">
            Loading your progress...
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'streak_5': return '🔥';
      case 'streak_10': return '⚡';
      case 'completion_10': return '🎯';
      case 'accuracy_90': return '🏆';
      default: return '⭐';
    }
  };

  const getBadgeName = (badge: string) => {
    switch (badge) {
      case 'streak_5': return 'Fire Streak!';
      case 'streak_10': return 'Lightning Fast!';
      case 'completion_10': return 'Sentence Master!';
      case 'accuracy_90': return 'Accuracy Champion!';
      default: return 'Achievement Unlocked!';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200' };
      case 'intermediate': return { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200' };
      case 'advanced': return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' };
      default: return { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' };
    }
  };

  const getPerformanceMessage = (accuracy: number) => {
    if (accuracy >= 90) return { message: "🌟 AMAZING!", color: "text-green-600" };
    if (accuracy >= 80) return { message: "🎉 GREAT JOB!", color: "text-blue-600" };
    if (accuracy >= 70) return { message: "👍 GOOD WORK!", color: "text-yellow-600" };
    if (accuracy >= 60) return { message: "💪 KEEP GOING!", color: "text-orange-600" };
    return { message: "🚀 PRACTICE MORE!", color: "text-red-600" };
  };

  const performance = getPerformanceMessage(progress.averageAccuracy);
  const levelColors = getLevelColor(progress.currentLevel);

  // Calculate current level progress percentage
  const getCurrentLevelProgress = () => {
    if (!progress.levelProgress) return 0;
    
    const levelKey = progress.currentLevel === 'beginner' ? 'easy' : 
                    progress.currentLevel === 'intermediate' ? 'medium' : 'hard';
    const levelData = progress.levelProgress[levelKey];
    
    if (!levelData || levelData.total === undefined || levelData.completed === undefined) {
      return 0;
    }
    
    return levelData.total > 0 ? (levelData.completed / levelData.total) * 100 : 0;
  };

  const currentLevelProgress = getCurrentLevelProgress();

  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl">
      {/* Header with Performance Message */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Your Progress Dashboard</h2>
        <div className={`text-lg font-semibold ${performance.color} animate-pulse`}>
          {performance.message}
        </div>
      </div>

      {/* Main Progress Circles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Accuracy - Type 1 Style */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <CircularProgress
                percentage={progress.averageAccuracy}
                size={100}
                strokeWidth={12}
                color="#3b82f6"
                backgroundColor="#e5e7eb"
                type="solid"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(progress.averageAccuracy)}%</div>
                  <div className="text-xs text-gray-500">Accuracy</div>
                </div>
              </CircularProgress>
            </div>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Overall Performance</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak - Type 2 Style */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <CircularProgress
                percentage={Math.min((progress.currentStreak / 10) * 100, 100)}
                size={100}
                strokeWidth={8}
                color="#f97316"
                backgroundColor="#fed7aa"
                type="segmented"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{progress.currentStreak}</div>
                  <div className="text-xs text-gray-500">Streak</div>
                </div>
              </CircularProgress>
            </div>
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">Fire Streak!</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Best: {progress.bestStreak}</div>
          </CardContent>
        </Card>

        {/* Speed - Type 3 Style */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <CircularProgress
                percentage={Math.min((progress.averageSpeed / 2) * 100, 100)}
                size={100}
                strokeWidth={10}
                color="#10b981"
                backgroundColor="#d1fae5"
                type="solid"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(progress.averageSpeed)}</div>
                  <div className="text-xs text-gray-500">per min</div>
                </div>
              </CircularProgress>
            </div>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Rocket className="h-5 w-5" />
              <span className="font-semibold">Speed Demon!</span>
            </div>
          </CardContent>
        </Card>

        {/* Level Progress - Type 4 Style */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <CircularProgress
                percentage={currentLevelProgress}
                size={100}
                strokeWidth={6}
                color="#8b5cf6"
                backgroundColor="#e9d5ff"
                type="concentric"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(currentLevelProgress)}%</div>
                  <div className="text-xs text-gray-500">Level</div>
                </div>
              </CircularProgress>
            </div>
            <div className="flex items-center justify-center gap-2 text-purple-600">
              <Crown className="h-5 w-5" />
              <span className="font-semibold capitalize">{progress.currentLevel} Master</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Breakdown with Enhanced Visuals */}
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Level Breakdown
            <Star className="h-6 w-6 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Easy Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <Badge className="bg-green-100 text-green-800 border-green-300 text-sm font-semibold px-3 py-1">
                  🌱 Easy Level ({Math.round(progress.levelProgress?.easy?.accuracy || 0)}% accuracy)
                </Badge>
              </div>
              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {progress.levelProgress?.easy?.completed || 0}/{progress.levelProgress?.easy?.total || 0}
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={progress.levelProgress?.easy?.total > 0 ? ((progress.levelProgress.easy.completed || 0) / (progress.levelProgress.easy.total || 1)) * 100 : 0} 
                className="h-4 bg-green-100" 
              />
            </div>
          </div>
          
          {/* Medium Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-sm font-semibold px-3 py-1">
                  ⚡ Medium Level ({Math.round(progress.levelProgress?.medium?.accuracy || 0)}% accuracy)
                </Badge>
              </div>
              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {progress.levelProgress?.medium?.completed || 0}/{progress.levelProgress?.medium?.total || 0}
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={progress.levelProgress?.medium?.total > 0 ? ((progress.levelProgress.medium.completed || 0) / (progress.levelProgress.medium.total || 1)) * 100 : 0} 
                className="h-4 bg-yellow-100" 
              />
            </div>
          </div>
          
          {/* Hard Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <Badge className="bg-red-100 text-red-800 border-red-300 text-sm font-semibold px-3 py-1">
                  🔥 Hard Level ({Math.round(progress.levelProgress?.hard?.accuracy || 0)}% accuracy)
                </Badge>
              </div>
              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {progress.levelProgress?.hard?.completed || 0}/{progress.levelProgress?.hard?.total || 0}
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={progress.levelProgress?.hard?.total > 0 ? ((progress.levelProgress.hard.completed || 0) / (progress.levelProgress.hard.total || 1)) * 100 : 0} 
                className="h-4 bg-red-100" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      {progress.badges.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              🏆 Your Achievements
              <Trophy className="h-6 w-6 text-yellow-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progress.badges.map((badge, index) => (
                <div 
                  key={index} 
                  className="bg-white/70 backdrop-blur-sm border border-yellow-300 rounded-lg p-4 text-center hover:scale-105 transition-transform duration-200 shadow-md"
                >
                  <div className="text-3xl mb-2 animate-bounce">{getBadgeIcon(badge)}</div>
                  <div className="font-bold text-gray-800">{getBadgeName(badge)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivational Message */}
      <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border-2 border-blue-200">
        <div className="text-lg font-semibold text-gray-800 mb-2">
          {progress.currentStreak >= 5 ? "🔥 You're on fire! Keep it up!" : 
           progress.averageAccuracy >= 80 ? "🌟 Amazing accuracy! You're doing great!" :
           "🚀 Every sentence makes you better! Keep practicing!"}
        </div>
        <div className="text-sm text-gray-600">
          {progress.completedSentences > 0 ? `You've completed ${progress.completedSentences} sentences!` : "Start your first sentence to begin your journey!"}
        </div>
      </div>
    </div>
  );
}
