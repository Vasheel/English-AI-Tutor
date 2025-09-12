// src/types/progress.ts
export interface StudentProgress {
    totalAttempts: number;
    correctAttempts: number;
    currentStreak: number;
    bestStreak: number;
    averageAccuracy: number;
    averageTime: number; // in seconds
    currentLevel: 'easy' | 'medium' | 'hard';
    levelProgress: {
      easy: { completed: number; total: number; accuracy: number };
      medium: { completed: number; total: number; accuracy: number };
      hard: { completed: number; total: number; accuracy: number };
    };
    badges: string[]; // Achievement badges earned
    totalTimeSpent: number; // in seconds
    sessionsCompleted: number;
  }
  
  export interface SentenceAttempt {
    id: string;
    sentence: string;
    difficulty: 'easy' | 'medium' | 'hard';
    spokenText: string;
    isCorrect: boolean;
    accuracy: number; // 0-100
    timeToComplete: number; // in seconds
    timestamp: Date;
  }
  
  export interface ProgressMetrics {
    accuracy: number;
    speed: number; // words per minute
    consistency: number; // streak consistency
    improvement: number; // progress over time
    engagement: number; // time spent learning
  }