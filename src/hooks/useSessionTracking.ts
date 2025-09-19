import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface SessionData {
  id?: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  total_time_spent: number; // in seconds
  last_activity: string;
  is_active: boolean;
}

interface ActivitySession {
  id?: string;
  user_id: string;
  activity_type: string;
  time_spent: number; // in seconds
  score: number;
  total_questions: number;
  difficulty_level?: number;
  session_data?: Json;
  created_at?: string;
}

export const useSessionTracking = () => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const sessionStartTime = useRef<number>(Date.now());
  const lastActivityTime = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pause current session (local only)
  const pauseSession = useCallback(async () => {
    if (!currentSession || !isActive) return;

    try {
      const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      // Update local session state only
      setCurrentSession(prev => prev ? {
        ...prev,
        total_time_spent: prev.total_time_spent + timeSpent,
        is_active: false,
        last_activity: new Date().toISOString()
      } : null);

      console.log('Session paused locally, time spent:', timeSpent);
    } catch (error) {
      console.error('Error pausing session:', error);
    }
  }, [currentSession, isActive]);

  // Check if user is active (mouse movement, clicks, keyboard)
  const updateActivity = useCallback(() => {
    lastActivityTime.current = Date.now();
    setIsActive(true);
    
    // Clear existing timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // Set timeout for inactivity (30 seconds)
    activityTimeoutRef.current = setTimeout(() => {
      setIsActive(false);
      pauseSession();
    }, 30 * 1000); // 30 seconds
  }, [pauseSession]);

  // Start a new session (local only since user_sessions table doesn't exist)
  const startSession = useCallback(async () => {
    if (!user) return;

    try {
      // Create a local session object
      const localSession: SessionData = {
        id: 'local-' + Date.now(),
        user_id: user.id,
        session_start: new Date().toISOString(),
        total_time_spent: 0,
        last_activity: new Date().toISOString(),
        is_active: true
      };
      
      setCurrentSession(localSession);
      sessionStartTime.current = Date.now();
      lastActivityTime.current = Date.now();
      setIsActive(true);

      console.log('Session started locally:', localSession.id);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }, [user]);

  // Resume session (local only)
  const resumeSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      // Update local session state only
      setCurrentSession(prev => prev ? { 
        ...prev, 
        is_active: true,
        last_activity: new Date().toISOString()
      } : null);
      
      sessionStartTime.current = Date.now();
      lastActivityTime.current = Date.now();
      setIsActive(true);

      console.log('Session resumed locally');
    } catch (error) {
      console.error('Error resuming session:', error);
    }
  }, [currentSession]);

  // End session (local only)
  const endSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      // Update local session state only
      setCurrentSession(prev => prev ? {
        ...prev,
        total_time_spent: prev.total_time_spent + timeSpent,
        session_end: new Date().toISOString(),
        is_active: false
      } : null);

      console.log('Session ended locally, total time:', timeSpent);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [currentSession]);

  // Track activity session (for specific activities like sentence builder)
  const trackActivitySession = useCallback(async (
    activityType: string, 
    timeSpent: number,
    score: number = 0,
    totalQuestions: number = 1,
    difficultyLevel: number = 1,
    sessionData?: Json
  ) => {
    if (!user) return;

    try {
      const activityData: ActivitySession = {
        user_id: user.id,
        activity_type: activityType,
        time_spent: timeSpent,
        score: score,
        total_questions: totalQuestions,
        difficulty_level: difficultyLevel,
        session_data: sessionData
      };

      const { error } = await supabase
        .from('activity_sessions')
        .insert(activityData);

      if (error) throw error;

      console.log('Activity session tracked:', activityType, timeSpent);
    } catch (error) {
      console.error('Error tracking activity session:', error);
    }
  }, [user]);

  // Get total time spent today
  const getTotalTimeToday = useCallback(async () => {
    if (!user) return;

    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Query activity_sessions table for today's data
      const { data: activityData, error: activityError } = await supabase
        .from('activity_sessions')
        .select('time_spent')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (!activityError && activityData) {
        const totalTime = activityData.reduce((sum, session) => sum + session.time_spent, 0);
        setTotalTimeToday(totalTime);
      } else {
        console.error('Error getting time from activity_sessions:', activityError);
        setTotalTimeToday(0);
      }
    } catch (error) {
      console.error('Error getting total time today:', error);
      setTotalTimeToday(0);
    }
  }, [user]);

  // Format time in human readable format
  const formatTime = useCallback((seconds: number): string => {
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
  }, []);

  // Initialize session tracking
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const initializeSession = async () => {
      try {
        // Start a new local session
        await startSession();
        await getTotalTimeToday();
      } catch (error) {
        console.error('Error initializing session:', error);
        await startSession();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [user, startSession, getTotalTimeToday]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [user, updateActivity]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseSession();
      } else {
        resumeSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseSession, resumeSession]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [endSession]);

  // Update total time every minute (local only)
  useEffect(() => {
    if (!isActive || !currentSession) return;

    intervalRef.current = setInterval(async () => {
      const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      // Update local state only
      setCurrentSession(prev => prev ? {
        ...prev,
        total_time_spent: prev.total_time_spent + timeSpent,
        last_activity: new Date().toISOString()
      } : null);

      sessionStartTime.current = Date.now();
    }, 60000); // Update every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, currentSession]);

  // Refresh total time every 30 seconds
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(() => {
      getTotalTimeToday();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [user, getTotalTimeToday]);

  // Debug function to check session data
  const debugSessionData = useCallback(async () => {
    if (!user) return;
    
    console.log('=== Session Debug Info ===');
    console.log('Current session:', currentSession);
    console.log('Total time today:', totalTimeToday);
    console.log('Is active:', isActive);
    console.log('Session start time:', sessionStartTime.current);
    console.log('Last activity time:', lastActivityTime.current);
    
    try {
      // Check activity_sessions table
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: activities, error: activitiesError } = await supabase
        .from('activity_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('Today\'s activity_sessions:', activities);
      console.log('activity_sessions error:', activitiesError);
      
    } catch (error) {
      console.error('Debug error:', error);
    }
    
    console.log('=== End Debug Info ===');
  }, [user, currentSession, totalTimeToday, isActive]);

  return {
    currentSession,
    totalTimeToday,
    isActive,
    loading,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    trackActivitySession,
    getTotalTimeToday,
    formatTime,
    debugSessionData
  };
};
