import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WordAnalyticsData {
  wordId?: string;
  gameMode: 'classic' | 'timed' | 'challenge';
  difficultyLevel: number;
  wordPresented: string;
  userAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  hintsUsed: number;
  hintTypes?: string[];
  challengeAttempted?: boolean;
  challengeCorrect?: boolean;
  pointsEarned: number;
  streakAtTime: number;
}

interface UserAnalytics {
  user_id: string;
  total_words_attempted: number;
  correct_answers: number;
  accuracy_rate: number;
  average_response_time: number;
  total_points_earned: number;
  total_hints_used: number;
  longest_streak: number;
  favorite_categories: string[];
  difficulty_preferences: Record<string, number>;
}

export const useWordScrambleAnalytics = () => {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const logGameEvent = async (eventData: WordAnalyticsData) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, skipping analytics');
        return;
      }

      // Use type assertion for the table that might not be in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('word_scramble_analytics')
        .insert({
          user_id: user.id,
          session_id: crypto.randomUUID(),
          word_id: eventData.wordId || null,
          game_mode: eventData.gameMode,
          difficulty_level: eventData.difficultyLevel,
          word_presented: eventData.wordPresented,
          user_answer: eventData.userAnswer,
          is_correct: eventData.isCorrect,
          response_time_seconds: eventData.responseTime,
          hints_used: eventData.hintsUsed,
          hint_types: eventData.hintTypes || [],
          challenge_attempted: eventData.challengeAttempted || false,
          challenge_correct: eventData.challengeCorrect || false,
          points_earned: eventData.pointsEarned,
          streak_at_time: eventData.streakAtTime,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log game event:', error);
      } else {
        console.log('Game event logged successfully');
      }
    } catch (error) {
      console.error('Failed to log game event:', error);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Use type assertion for the view
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('word_scramble_performance')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Failed to fetch analytics:', error);
      }
      
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .rpc('get_word_scramble_leaderboard');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchUserAnalytics();
  }, []);

  return {
    analytics,
    loading,
    logGameEvent,
    fetchUserAnalytics,
    fetchLeaderboard
  };
};