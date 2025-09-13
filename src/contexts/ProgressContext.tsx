import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProgressData {
  activity_type: string;
  total_attempts: number;
  correct_answers: number;
  total_time_spent: number;
}

interface ProgressUpdate {
  total_attempts: number;
  correct_answers: number;
  total_time_spent: number;
  best_streak?: number;
}

interface ProgressContextType {
  progress: ProgressData[];
  updateProgress: (activityType: string, update: ProgressUpdate) => Promise<void>;
  fetchProgress: () => Promise<void>;
  isLoading: boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found');
        setProgress([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching progress:', error);
        setProgress([]);
      } else {
        setProgress(data || []);
        console.log('Progress fetched:', data);
      }
    } catch (error) {
      console.error('Error in fetchProgress:', error);
      setProgress([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (activityType: string, update: ProgressUpdate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found for progress update');
        return;
      }

      // First, get existing progress
      const { data: existingData, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_type', activityType)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Error fetching existing progress:', fetchError);
        return;
      }

      const currentProgress = existingData || {
        total_attempts: 0,
        correct_answers: 0,
        total_time_spent: 0
      };

      // Calculate new totals
      const newProgress = {
        user_id: user.id,
        activity_type: activityType,
        total_attempts: currentProgress.total_attempts + update.total_attempts,
        correct_answers: currentProgress.correct_answers + update.correct_answers,
        total_time_spent: currentProgress.total_time_spent + update.total_time_spent,
        updated_at: new Date().toISOString()
      };

      // Upsert the progress
      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert(newProgress, {
          onConflict: 'user_id,activity_type'
        });

      if (upsertError) {
        console.error('Error updating progress:', upsertError);
      } else {
        console.log('Progress updated successfully:', newProgress);
        // Refresh progress data
        await fetchProgress();
      }
    } catch (error) {
      console.error('Error in updateProgress:', error);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const value: ProgressContextType = {
    progress,
    updateProgress,
    fetchProgress,
    isLoading
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

// Export ProgressContext for useProgress hook
export { ProgressContext };