
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserProgress {
  id?: string;
  user_id: string;
  activity_type: string;
  total_attempts: number;
  correct_answers: number;
  total_time_spent: number;
  current_level: number;
  current_streak: number;
  best_streak: number;
  last_activity: string;
}

export interface ActivitySession {
  user_id: string;
  activity_type: string;
  score: number;
  total_questions: number;
  time_spent: number;
  difficulty_level: number;
  session_data?: any;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  earned_at: string;
}

export const useSupabaseProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
      fetchUserBadges();
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBadges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badge:badges(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const updateProgress = async (activityType: string, updates: Partial<UserProgress>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .update({
          ...updates,
          last_activity: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('activity_type', activityType)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProgress(prev => 
        prev.map(p => p.activity_type === activityType ? data : p)
      );

      // Check for new badges
      await checkForNewBadges(activityType, data);
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to save progress');
    }
  };

  const addSession = async (session: ActivitySession) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activity_sessions')
        .insert({
          ...session,
          user_id: user.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  const checkForNewBadges = async (activityType: string, currentProgress: UserProgress) => {
    if (!user) return;

    try {
      // Fetch all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*');

      if (badgesError) throw badgesError;

      // Check which badges the user should have based on progress
      const earnedBadgeIds = badges.map(ub => ub.badge.id);
      
      for (const badge of allBadges || []) {
        if (earnedBadgeIds.includes(badge.id)) continue;

        let shouldEarn = false;

        // Check badge requirements
        if (badge.category === activityType || badge.category === 'general') {
          if (badge.requirement_type === 'score' && currentProgress.correct_answers >= badge.requirement_value) {
            shouldEarn = true;
          } else if (badge.requirement_type === 'completion' && currentProgress.total_attempts >= badge.requirement_value) {
            shouldEarn = true;
          } else if (badge.requirement_type === 'time' && currentProgress.total_time_spent >= badge.requirement_value) {
            shouldEarn = true;
          }
        }

        if (shouldEarn) {
          // Award the badge
          const { error: insertError } = await supabase
            .from('user_badges')
            .insert({
              user_id: user.id,
              badge_id: badge.id
            });

          if (!insertError) {
            toast.success(`🎉 New badge earned: ${badge.name}!`);
            fetchUserBadges(); // Refresh badges
          }
        }
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  const getProgressByType = (activityType: string) => {
    return progress.find(p => p.activity_type === activityType);
  };

  return {
    progress,
    badges,
    loading,
    updateProgress,
    addSession,
    getProgressByType,
    fetchProgress
  };
};
