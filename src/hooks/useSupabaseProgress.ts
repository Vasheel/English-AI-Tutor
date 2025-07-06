import { useState, useEffect, useCallback } from 'react';
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

interface SessionData {
  [key: string]: string | number | boolean | null;
}

export interface ActivitySession {
  user_id: string;
  activity_type: string;
  score: number;
  total_questions: number;
  time_spent: number;
  difficulty_level: number;
  session_data?: Record<string, SessionData>;
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

  const fetchProgress = useCallback(async () => {
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
  }, [user]);

  const fetchUserBadges = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProgress();
      fetchUserBadges();
    }
  }, [user, fetchProgress, fetchUserBadges]);

  const updateProgress = async (activityType: string, updates: Partial<UserProgress>) => {
    if (!user) return;

    console.log(`🔄 Updating progress for ${activityType}:`, updates);

    try {
      // First get the current progress for this activity
      const { data: currentProgress, error: getError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_type', activityType)
        .single();

      if (getError) {
        console.log(`📝 Creating new progress record for ${activityType}`);
        // If no record exists yet, create a new one
        const { error: createError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            activity_type: activityType,
            total_attempts: updates.total_attempts || 0,
            correct_answers: updates.correct_answers || 0,
            total_time_spent: updates.total_time_spent || 0,
            current_level: updates.current_level || 1,
            current_streak: updates.current_streak || 0,
            best_streak: updates.best_streak || 0,
            last_activity: new Date().toISOString()
          });

        if (createError) throw createError;
        
        console.log(`✅ Created new progress record for ${activityType}`);
        // Refresh progress data after creating new record
        await fetchProgress();
        return;
      }

      console.log(`📊 Current progress for ${activityType}:`, currentProgress);

      // Validate current data to prevent corruption
      const currentAttempts = currentProgress.total_attempts || 0;
      const currentCorrect = currentProgress.correct_answers || 0;
      
      // Check for data corruption (correct answers > attempts)
      if (currentCorrect > currentAttempts) {
        console.warn(`⚠️ Data corruption detected for ${activityType}: ${currentCorrect} correct > ${currentAttempts} attempts`);
        // Reset corrupted data
        const resetProgress: UserProgress = {
          ...currentProgress,
          total_attempts: 0,
          correct_answers: 0,
          total_time_spent: 0,
          current_level: 1,
          current_streak: 0,
          best_streak: 0,
          last_activity: new Date().toISOString()
        };
        
        const { error: resetError } = await supabase
          .from('user_progress')
          .update(resetProgress)
          .eq('user_id', user.id)
          .eq('activity_type', activityType);
          
        if (resetError) throw resetError;
        
        console.log(`🔄 Reset corrupted data for ${activityType}`);
        await fetchProgress();
        return;
      }

      // Calculate new totals by adding to existing values
      const newProgress: UserProgress = {
        ...currentProgress,
        total_attempts: currentAttempts + (updates.total_attempts || 0),
        correct_answers: currentCorrect + (updates.correct_answers || 0),
        total_time_spent: (currentProgress.total_time_spent || 0) + (updates.total_time_spent || 0),
        current_level: updates.current_level || currentProgress.current_level,
        current_streak: updates.current_streak || currentProgress.current_streak,
        best_streak: Math.max(updates.best_streak || 0, currentProgress.best_streak || 0),
        last_activity: new Date().toISOString()
      };

      console.log(`📊 Validation check:`, {
        currentAttempts,
        currentCorrect,
        newAttempts: newProgress.total_attempts,
        newCorrect: newProgress.correct_answers,
        updates
      });

      // Final validation before saving - allow equal values (perfect scores)
      if (newProgress.correct_answers > newProgress.total_attempts) {
        console.error(`❌ Invalid progress data: ${newProgress.correct_answers} correct > ${newProgress.total_attempts} attempts`);
        console.error(`🔍 Debug info:`, {
          activityType,
          currentAttempts,
          currentCorrect,
          updates,
          newProgress
        });
        
        // Completely reset corrupted data and start fresh with current attempt
        console.warn(`🔄 Resetting corrupted data for ${activityType} and starting fresh`);
        const resetProgress: UserProgress = {
          ...currentProgress,
          total_attempts: updates.total_attempts || 1,
          correct_answers: updates.correct_answers || 0,
          total_time_spent: updates.total_time_spent || 0,
          current_level: 1,
          current_streak: updates.current_streak || 0,
          best_streak: updates.best_streak || 0,
          last_activity: new Date().toISOString()
        };
        
        console.log(`🔧 Reset progress data:`, resetProgress);
        console.log(`📊 New accuracy: ${resetProgress.correct_answers}/${resetProgress.total_attempts} = ${Math.round((resetProgress.correct_answers / resetProgress.total_attempts) * 100)}%`);
        
        // Update with reset data
        const { error: resetError } = await supabase
          .from('user_progress')
          .update(resetProgress)
          .eq('user_id', user.id)
          .eq('activity_type', activityType);

        if (resetError) throw resetError;

        // Update local state with reset data
        setProgress(prev => {
          const existingIndex = prev.findIndex(p => p.activity_type === activityType);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = resetProgress;
            return updated;
          } else {
            return [...prev, resetProgress];
          }
        });

        console.log(`✅ Reset corrupted data for ${activityType}`);
        toast.success(`Progress data reset for ${activityType.replace('_', ' ')}`);
        return;
      }

      // Additional validation: ensure reasonable values
      if (newProgress.total_attempts < 0 || newProgress.correct_answers < 0) {
        console.error(`❌ Negative values detected: attempts=${newProgress.total_attempts}, correct=${newProgress.correct_answers}`);
        toast.error('Invalid progress values detected');
        return;
      }

      console.log(`📈 New progress for ${activityType}:`, newProgress);

      // Update the record with new totals
      const { error: updateError } = await supabase
        .from('user_progress')
        .update(newProgress)
        .eq('user_id', user.id)
        .eq('activity_type', activityType);

      if (updateError) throw updateError;

      console.log(`✅ Updated progress for ${activityType} in database`);

      // Update local state immediately
      setProgress(prev => {
        const existingIndex = prev.findIndex(p => p.activity_type === activityType);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newProgress;
          return updated;
        } else {
          return [...prev, newProgress];
        }
      });

      console.log(`🔄 Updated local state for ${activityType}`);

      // Check for new badges
      await checkForNewBadges(activityType, newProgress);
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
        .insert([{
          activity_type: session.activity_type,
          score: session.score,
          total_questions: session.total_questions,
          time_spent: session.time_spent,
          difficulty_level: session.difficulty_level,
          session_data: session.session_data,
          user_id: user.id
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Failed to save progress');
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

  const resetProgress = async (activityType?: string) => {
    if (!user) return;

    try {
      if (activityType) {
        // Reset specific activity
        console.log(`🔄 Resetting progress for ${activityType}`);
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('activity_type', activityType);

        if (error) throw error;
        console.log(`✅ Reset progress for ${activityType}`);
      } else {
        // Reset all progress
        console.log('🔄 Resetting all progress data');
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
        console.log('✅ Reset all progress data');
      }

      // Refresh progress data
      await fetchProgress();
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast.error('Failed to reset progress data');
    }
  };

  const getProgressStats = () => {
    const stats = {
      totalAttempts: progress.reduce((sum, p) => sum + (p.total_attempts || 0), 0),
      totalCorrect: progress.reduce((sum, p) => sum + (p.correct_answers || 0), 0),
      overallAccuracy: 0,
      activities: progress.map(p => ({
        type: p.activity_type,
        attempts: p.total_attempts || 0,
        correct: p.correct_answers || 0,
        accuracy: p.total_attempts > 0 ? Math.round((p.correct_answers / p.total_attempts) * 100) : 0
      }))
    };
    
    stats.overallAccuracy = stats.totalAttempts > 0 
      ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
      : 0;
    
    return stats;
  };

  return {
    progress,
    badges,
    loading,
    updateProgress,
    addSession,
    getProgressByType,
    fetchProgress,
    resetProgress,
    getProgressStats
  };
};
