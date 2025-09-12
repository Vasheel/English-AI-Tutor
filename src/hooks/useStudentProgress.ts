// src/hooks/useStudentProgress.ts
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseProgress } from './useSupabaseProgress';

interface Sentence {
  id: string;
  words: string[];
  correct: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  grammar_focus?: string;
  hint?: string;
}

export interface StudentProgress {
  totalSentences: number;
  completedSentences: number;
  correctAttempts: number;
  totalAttempts: number;
  currentStreak: number;
  bestStreak: number;
  averageAccuracy: number;
  timeSpent: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  difficultyProgress: {
    beginner: { completed: number; total: number };
    intermediate: { completed: number; total: number };
    advanced: { completed: number; total: number };
  };
  levelProgress: {
    easy: { completed: number; total: number; accuracy: number };
    medium: { completed: number; total: number; accuracy: number };
    hard: { completed: number; total: number; accuracy: number };
  };
  badges: string[];
}

export interface ProgressUpdate {
  sentenceId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isCorrect: boolean;
  attempts: number;
  timeSpent: number;
}

export interface SentenceAttempt {
  sentenceId: string;
  accuracy: number;
  timeSpent: number;
  timestamp: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isCorrect: boolean;
}

export function useStudentProgress() {
  const [progress, setProgress] = useState<StudentProgress>({
    totalSentences: 0,
    completedSentences: 0,
    correctAttempts: 0,
    totalAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageAccuracy: 0,
    timeSpent: 0,
    currentLevel: 'beginner',
    difficultyProgress: {
      beginner: { completed: 0, total: 0 },
      intermediate: { completed: 0, total: 0 },
      advanced: { completed: 0, total: 0 }
    },
    levelProgress: {
      easy: { completed: 0, total: 0, accuracy: 0 },
      medium: { completed: 0, total: 0, accuracy: 0 },
      hard: { completed: 0, total: 0, accuracy: 0 }
    },
    badges: []
  });

  const [completedSentences, setCompletedSentences] = useState<Set<string>>(new Set());
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [attemptStartTime, setAttemptStartTime] = useState<number>(0);
  const [sentenceAttempts, setSentenceAttempts] = useState<SentenceAttempt[]>([]);
  const { updateProgress } = useSupabaseProgress();

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('sentenceBuilderProgress');
    const savedCompleted = localStorage.getItem('sentenceBuilderCompleted');
    const savedAttempts = localStorage.getItem('sentenceBuilderAttempts');
    const savedVersion = localStorage.getItem('sentenceBuilderVersion');
    
    // Check if we need to reset due to data structure changes
    const currentVersion = '2.2'; // Increment this when data structure changes
    if (savedVersion !== currentVersion) {
      console.log('Progress data structure changed, resetting...');
      localStorage.removeItem('sentenceBuilderProgress');
      localStorage.removeItem('sentenceBuilderCompleted');
      localStorage.removeItem('sentenceBuilderAttempts');
      localStorage.setItem('sentenceBuilderVersion', currentVersion);
      return; // Use default values
    }
    
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        // Validate that the progress has the correct structure
        if (parsedProgress.levelProgress && 
            parsedProgress.levelProgress.easy && 
            parsedProgress.levelProgress.medium && 
            parsedProgress.levelProgress.hard) {
          setProgress(parsedProgress);
        } else {
          console.log('Invalid progress structure, resetting...');
          localStorage.removeItem('sentenceBuilderProgress');
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        localStorage.removeItem('sentenceBuilderProgress');
      }
    }
    
    if (savedCompleted) {
      try {
        setCompletedSentences(new Set(JSON.parse(savedCompleted)));
      } catch (error) {
        console.error('Error loading completed sentences:', error);
        localStorage.removeItem('sentenceBuilderCompleted');
      }
    }

    if (savedAttempts) {
      try {
        setSentenceAttempts(JSON.parse(savedAttempts));
      } catch (error) {
        console.error('Error loading sentence attempts:', error);
        localStorage.removeItem('sentenceBuilderAttempts');
      }
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sentenceBuilderProgress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('sentenceBuilderCompleted', JSON.stringify([...completedSentences]));
  }, [completedSentences]);

  useEffect(() => {
    localStorage.setItem('sentenceBuilderAttempts', JSON.stringify(sentenceAttempts));
  }, [sentenceAttempts]);

  const updateStudentProgress = useCallback((update: ProgressUpdate) => {
    setProgress(prev => {
      const newProgress = { ...prev };
      
      // Update basic stats
      newProgress.totalAttempts += update.attempts;
      if (update.isCorrect) {
        newProgress.correctAttempts += 1;
        newProgress.currentStreak += 1;
        newProgress.bestStreak = Math.max(newProgress.bestStreak, newProgress.currentStreak);
        
        // Mark sentence as completed if not already
        if (!completedSentences.has(update.sentenceId)) {
          newProgress.completedSentences += 1;
          setCompletedSentences(prev => new Set([...prev, update.sentenceId]));
          
          // Update difficulty progress
          newProgress.difficultyProgress[update.difficulty].completed += 1;
        }
      } else {
        newProgress.currentStreak = 0;
      }
      
      // Update time spent
      newProgress.timeSpent += update.timeSpent;
      
      // Calculate average accuracy
      newProgress.averageAccuracy = newProgress.totalAttempts > 0 
        ? (newProgress.correctAttempts / newProgress.totalAttempts) * 100 
        : 0;
      
      // Update level-specific accuracy and totals
      const levelKey = update.difficulty === 'beginner' ? 'easy' : 
                      update.difficulty === 'intermediate' ? 'medium' : 'hard';
      const levelProgress = newProgress.levelProgress[levelKey];
      
      // Update total attempts for this level
      levelProgress.total += 1;
      
      // Update completed (correct attempts) for this level
      if (update.isCorrect) {
        levelProgress.completed += 1;
      }
      
      // Calculate accuracy for this level based on correct attempts vs total attempts
      if (levelProgress.total > 0) {
        levelProgress.accuracy = (levelProgress.completed / levelProgress.total) * 100;
      }
      
      // Update badges based on achievements
      const newBadges = [...newProgress.badges];
      if (newProgress.currentStreak >= 5 && !newBadges.includes('streak_5')) {
        newBadges.push('streak_5');
      }
      if (newProgress.currentStreak >= 10 && !newBadges.includes('streak_10')) {
        newBadges.push('streak_10');
      }
      if (newProgress.completedSentences >= 10 && !newBadges.includes('completion_10')) {
        newBadges.push('completion_10');
      }
      if (newProgress.averageAccuracy >= 90 && !newBadges.includes('accuracy_90')) {
        newBadges.push('accuracy_90');
      }
      newProgress.badges = newBadges;
      
      // Also update Supabase progress
      updateProgress('sentence_builder', {
        total_attempts: newProgress.totalAttempts,
        correct_answers: newProgress.correctAttempts,
        total_time_spent: newProgress.timeSpent,
        current_streak: newProgress.currentStreak,
        best_streak: newProgress.bestStreak
      });
      
      return newProgress;
    });
  }, [completedSentences, updateProgress]);

  const resetProgress = useCallback(() => {
    setProgress({
      totalSentences: 0,
      completedSentences: 0,
      correctAttempts: 0,
      totalAttempts: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageAccuracy: 0,
      timeSpent: 0,
      currentLevel: 'beginner',
      difficultyProgress: {
        beginner: { completed: 0, total: 0 },
        intermediate: { completed: 0, total: 0 },
        advanced: { completed: 0, total: 0 }
      },
      levelProgress: {
        easy: { completed: 0, total: 0, accuracy: 0 },
        medium: { completed: 0, total: 0, accuracy: 0 },
        hard: { completed: 0, total: 0, accuracy: 0 }
      },
      badges: []
    });
    setCompletedSentences(new Set());
    setSentenceAttempts([]);
    localStorage.removeItem('sentenceBuilderProgress');
    localStorage.removeItem('sentenceBuilderCompleted');
    localStorage.removeItem('sentenceBuilderAttempts');
    localStorage.removeItem('sentenceBuilderVersion');
  }, []);

  const forceResetAllData = useCallback(() => {
    // Clear all localStorage data
    localStorage.removeItem('sentenceBuilderProgress');
    localStorage.removeItem('sentenceBuilderCompleted');
    localStorage.removeItem('sentenceBuilderAttempts');
    localStorage.removeItem('sentenceBuilderVersion');
    
    // Reset all state
    setProgress({
      totalSentences: 0,
      completedSentences: 0,
      correctAttempts: 0,
      totalAttempts: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageAccuracy: 0,
      timeSpent: 0,
      currentLevel: 'beginner',
      difficultyProgress: {
        beginner: { completed: 0, total: 0 },
        intermediate: { completed: 0, total: 0 },
        advanced: { completed: 0, total: 0 }
      },
      levelProgress: {
        easy: { completed: 0, total: 0, accuracy: 0 },
        medium: { completed: 0, total: 0, accuracy: 0 },
        hard: { completed: 0, total: 0, accuracy: 0 }
      },
      badges: []
    });
    setCompletedSentences(new Set());
    setSentenceAttempts([]);
    
    console.log('All progress data has been reset');
  }, []);

  const isSentenceCompleted = useCallback((sentenceId: string) => {
    return completedSentences.has(sentenceId);
  }, [completedSentences]);

  const recordAttempt = useCallback((transcript: string, timeToComplete: number) => {
    if (!currentSentence) {
      return { accuracy: 0, isCorrect: false };
    }

    // Clean up the transcript for comparison
    const cleanTranscript = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '');
    const cleanCorrect = currentSentence.correct.toLowerCase().replace(/[.,!?;:]/g, '');
    
    // Calculate accuracy based on word matching
    const transcriptWords = cleanTranscript.split(/\s+/);
    const correctWords = cleanCorrect.split(/\s+/);
    
    let matches = 0;
    const maxLength = Math.max(transcriptWords.length, correctWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (transcriptWords[i] && correctWords[i] && transcriptWords[i] === correctWords[i]) {
        matches++;
      }
    }
    
    const accuracy = maxLength > 0 ? Math.round((matches / maxLength) * 100) : 0;
    const isCorrect = accuracy >= 80; // Consider 80%+ as correct
    
    // Record individual sentence attempt
    const attempt: SentenceAttempt = {
      sentenceId: currentSentence.id,
      accuracy,
      timeSpent: Math.floor(timeToComplete),
      timestamp: Date.now(),
      difficulty: currentSentence.difficulty,
      isCorrect
    };
    
    setSentenceAttempts(prev => [...prev, attempt]);
    
    // Update progress
    updateStudentProgress({
      sentenceId: currentSentence.id,
      difficulty: currentSentence.difficulty,
      isCorrect,
      attempts: 1,
      timeSpent: Math.floor(timeToComplete)
    });
    
    return { accuracy, isCorrect };
  }, [currentSentence, updateStudentProgress]);

  const getProgressMetrics = useCallback(() => {
    // Calculate speed as sentences per minute based on completed sentences and time spent
    const speed = progress.completedSentences > 0 && progress.timeSpent > 0 
      ? (progress.completedSentences / (progress.timeSpent / 60)) 
      : 0;
    
    return {
      accuracy: progress.averageAccuracy,
      streak: progress.currentStreak,
      bestStreak: progress.bestStreak,
      totalCompleted: progress.completedSentences,
      timeSpent: progress.timeSpent,
      speed: Math.round(speed * 10) / 10 // Round to 1 decimal place
    };
  }, [progress]);

  const getDetailedAnalytics = useCallback(() => {
    const recentAttempts = sentenceAttempts.slice(-10); // Last 10 attempts
    const accuracyTrend = recentAttempts.map(attempt => attempt.accuracy);
    const timeTrend = recentAttempts.map(attempt => attempt.timeSpent);
    
    const difficultyStats = {
      beginner: sentenceAttempts.filter(a => a.difficulty === 'beginner'),
      intermediate: sentenceAttempts.filter(a => a.difficulty === 'intermediate'),
      advanced: sentenceAttempts.filter(a => a.difficulty === 'advanced')
    };

    return {
      recentAttempts,
      accuracyTrend,
      timeTrend,
      difficultyStats,
      totalAttempts: sentenceAttempts.length,
      averageAccuracy: sentenceAttempts.length > 0 
        ? sentenceAttempts.reduce((sum, attempt) => sum + attempt.accuracy, 0) / sentenceAttempts.length 
        : 0,
      averageTime: sentenceAttempts.length > 0 
        ? sentenceAttempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) / sentenceAttempts.length 
        : 0
    };
  }, [sentenceAttempts]);

  const nextSentence = useCallback((newSentence: Sentence) => {
    setCurrentSentence(newSentence);
    setAttemptStartTime(Date.now());
    
    // Update current level in progress
    setProgress(prev => ({
      ...prev,
      currentLevel: newSentence.difficulty
    }));
  }, []);

  return {
    progress,
    currentSentence,
    recordAttempt,
    getProgressMetrics,
    getDetailedAnalytics,
    nextSentence,
    updateStudentProgress,
    resetProgress,
    forceResetAllData,
    isSentenceCompleted,
    setAttemptStartTime,
    sentenceAttempts
  };
}
