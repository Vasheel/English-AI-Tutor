import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

interface TimeTrackerData {
  sessionStartTime: number;
  totalSessionTime: number;
  isTracking: boolean;
  isUserActive: boolean;
  awayStartTime: number | null;
  lastActiveTime: number;
}

const LiveTimeTracker: React.FC = () => {
  const [sessionTime, setSessionTime] = useState(0);
  const [todayTime, setTodayTime] = useState(0);
  const [weekTime, setWeekTime] = useState(0);
  const [isTracking, setIsTracking] = useState(true);
  const [isUserActive, setIsUserActive] = useState(true);
  const [status, setStatus] = useState<'active' | 'paused' | 'away'>('active');
  const [statusText, setStatusText] = useState('Tracking Active - You\'re on the site!');
  
  const trackerData = useRef<TimeTrackerData>({
    sessionStartTime: Date.now(),
    totalSessionTime: 0,
    isTracking: true,
    isUserActive: true,
    awayStartTime: null,
    lastActiveTime: Date.now()
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format time in HH:MM:SS format
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get current session time
  const getCurrentSessionTime = (): number => {
    if (!trackerData.current.isTracking) return trackerData.current.totalSessionTime;
    
    // If user is away, don't count time since they became away
    if (!trackerData.current.isUserActive && trackerData.current.awayStartTime) {
      // Calculate time up to when they became away
      const timeUntilAway = trackerData.current.awayStartTime - trackerData.current.sessionStartTime;
      return trackerData.current.totalSessionTime + timeUntilAway;
    }
    
    // If user is active, count time normally
    return trackerData.current.totalSessionTime + (Date.now() - trackerData.current.sessionStartTime);
  };

  // Get today's total time
  const getTodayTime = (): number => {
    const today = getDateKey(new Date());
    const todayData = getStoredData('daily')[today] || 0;
    return todayData + getCurrentSessionTime();
  };

  // Get week's total time
  const getWeekTime = (): number => {
    const weekData = getStoredData('weekly');
    let weekTotal = 0;
    const today = new Date();
    
    // Get all days from this week (Sunday to Saturday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayKey = getDateKey(day);
      weekTotal += weekData[dayKey] || 0;
    }
    
    return weekTotal + getCurrentSessionTime();
  };

  // Update display
  const updateDisplay = () => {
    setSessionTime(getCurrentSessionTime());
    setTodayTime(getTodayTime());
    setWeekTime(getWeekTime());
  };

  // Update status
  const updateStatus = (type: 'active' | 'paused' | 'away', message: string) => {
    setStatus(type);
    setStatusText(message);
  };

  // Handle user activity
  const handleUserActivity = () => {
    trackerData.current.lastActiveTime = Date.now();
    
    if (!trackerData.current.isUserActive && trackerData.current.isTracking) {
      trackerData.current.isUserActive = true;
      trackerData.current.awayStartTime = null;
      setIsUserActive(true);
      updateStatus('active', 'Tracking Active - You\'re on the site!');
      console.log('✅ Timer resumed due to user activity:', {
        resumeTime: new Date().toLocaleTimeString(),
        sessionTime: Math.round(getCurrentSessionTime() / 1000) + 's'
      });
    }
  };

  // Check user activity
  const checkUserActivity = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - trackerData.current.lastActiveTime;
    
    // Consider user away after 30 seconds of inactivity
    if (timeSinceLastActivity > 30000 && trackerData.current.isUserActive && trackerData.current.isTracking) {
      trackerData.current.isUserActive = false;
      trackerData.current.awayStartTime = now;
      setIsUserActive(false);
      updateStatus('away', 'Away - No activity detected');
      console.log('🛑 Timer paused due to inactivity:', {
        timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000) + 's',
        awayStartTime: new Date(now).toLocaleTimeString()
      });
    }
  };

  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (trackerData.current.isTracking && trackerData.current.isUserActive) {
        // Save current session time before pausing
        trackerData.current.totalSessionTime = getCurrentSessionTime();
        trackerData.current.isUserActive = false;
        trackerData.current.awayStartTime = Date.now();
        trackerData.current.sessionStartTime = Date.now(); // Reset session start time
        setIsUserActive(false);
        updateStatus('away', 'Away - Tab not active');
        console.log('🛑 Timer paused due to tab switch:', {
          awayTime: new Date().toLocaleTimeString(),
          sessionTime: Math.round(trackerData.current.totalSessionTime / 1000) + 's',
          totalSessionTime: trackerData.current.totalSessionTime
        });
      }
    } else {
      if (trackerData.current.isTracking && !trackerData.current.isUserActive) {
        trackerData.current.isUserActive = true;
        trackerData.current.awayStartTime = null;
        trackerData.current.lastActiveTime = Date.now();
        trackerData.current.sessionStartTime = Date.now(); // Reset session start time
        setIsUserActive(true);
        updateStatus('active', 'Tracking Active - Welcome back!');
        console.log('✅ Timer resumed due to tab return:', {
          resumeTime: new Date().toLocaleTimeString(),
          sessionTime: Math.round(getCurrentSessionTime() / 1000) + 's',
          totalSessionTime: trackerData.current.totalSessionTime
        });
      }
    }
  };

  // Save data to localStorage
  const saveData = () => {
    const now = Date.now();
    const today = getDateKey(new Date());
    const currentSessionTime = getCurrentSessionTime();
    
    // Save daily data
    const dailyData = getStoredData('daily');
    dailyData[today] = (dailyData[today] || 0);
    
    // Save weekly data  
    const weeklyData = getStoredData('weekly');
    weeklyData[today] = dailyData[today];
    
    // Save current session info
    const sessionData = {
      startTime: trackerData.current.sessionStartTime,
      totalTime: trackerData.current.totalSessionTime,
      lastSaveTime: now,
      isTracking: trackerData.current.isTracking
    };

    localStorage.setItem('timeTracker_daily', JSON.stringify(dailyData));
    localStorage.setItem('timeTracker_weekly', JSON.stringify(weeklyData));
    localStorage.setItem('timeTracker_session', JSON.stringify(sessionData));
  };

  // Load stored data
  const loadStoredData = () => {
    const sessionData = getStoredData('session');
    const now = Date.now();
    
    if (sessionData && sessionData.lastSaveTime) {
      // If last save was today, restore session
      const lastSaveDate = getDateKey(new Date(sessionData.lastSaveTime));
      const todayDate = getDateKey(new Date());
      
      if (lastSaveDate === todayDate) {
        trackerData.current.sessionStartTime = sessionData.startTime || now;
        trackerData.current.totalSessionTime = sessionData.totalTime || 0;
        
        // Add time since last save if tracking was active
        if (sessionData.isTracking) {
          trackerData.current.totalSessionTime += (now - sessionData.lastSaveTime);
        }
      }
    }
  };

  // Get stored data from localStorage
  const getStoredData = (type: string): any => {
    try {
      const data = localStorage.getItem(`timeTracker_${type}`);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to parse stored data:', e);
      return {};
    }
  };

  // Get date key for storage
  const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Control functions
  const pauseTracking = () => {
    if (trackerData.current.isTracking) {
      trackerData.current.totalSessionTime = getCurrentSessionTime();
      trackerData.current.isTracking = false;
      setIsTracking(false);
      updateStatus('paused', 'Tracking Paused');
      saveData();
    }
  };

  const resumeTracking = () => {
    if (!trackerData.current.isTracking) {
      trackerData.current.sessionStartTime = Date.now();
      trackerData.current.isTracking = true;
      trackerData.current.isUserActive = true;
      trackerData.current.lastActiveTime = Date.now();
      setIsTracking(true);
      setIsUserActive(true);
      updateStatus('active', 'Tracking Resumed');
    }
  };

  const resetSession = () => {
    trackerData.current.sessionStartTime = Date.now();
    trackerData.current.totalSessionTime = 0;
    if (!trackerData.current.isTracking) {
      resumeTracking();
    }
    updateDisplay();
  };

  // Initialize component
  useEffect(() => {
    loadStoredData();
    updateDisplay();

    // Set up event listeners
    const activityEvents = [
      'mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave',
      'keydown', 'keyup', 'keypress', 
      'scroll', 'wheel',
      'touchstart', 'touchend', 'touchmove',
      'click', 'dblclick',
      'focus', 'blur',
      'resize'
    ];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle window focus/blur for additional detection
    window.addEventListener('focus', () => {
      if (trackerData.current.isTracking && !trackerData.current.isUserActive) {
        trackerData.current.isUserActive = true;
        trackerData.current.awayStartTime = null;
        trackerData.current.lastActiveTime = Date.now();
        trackerData.current.sessionStartTime = Date.now(); // Reset session start time
        setIsUserActive(true);
        updateStatus('active', 'Tracking Active - Window focused');
        console.log('✅ Timer resumed due to window focus:', {
          resumeTime: new Date().toLocaleTimeString(),
          sessionTime: Math.round(getCurrentSessionTime() / 1000) + 's',
          totalSessionTime: trackerData.current.totalSessionTime
        });
      }
    });

    window.addEventListener('blur', () => {
      if (trackerData.current.isTracking && trackerData.current.isUserActive) {
        // Save current session time before pausing
        trackerData.current.totalSessionTime = getCurrentSessionTime();
        trackerData.current.isUserActive = false;
        trackerData.current.awayStartTime = Date.now();
        trackerData.current.sessionStartTime = Date.now(); // Reset session start time
        setIsUserActive(false);
        updateStatus('away', 'Away - Window blurred');
        console.log('🛑 Timer paused due to window blur:', {
          awayTime: new Date().toLocaleTimeString(),
          sessionTime: Math.round(trackerData.current.totalSessionTime / 1000) + 's',
          totalSessionTime: trackerData.current.totalSessionTime
        });
      }
    });

    window.addEventListener('beforeunload', saveData);

    // Start tracking interval
    intervalRef.current = setInterval(() => {
      if (trackerData.current.isTracking) {
        updateDisplay();
        saveData();
      }
    }, 1000);

    // Activity check interval
    activityTimeoutRef.current = setInterval(checkUserActivity, 5000);

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => {});
      window.removeEventListener('blur', () => {});
      window.removeEventListener('beforeunload', saveData);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Clock className="h-5 w-5" />
          ⏰ Live Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Cards */}
        <div className="grid gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-l-green-500">
            <div className="text-sm text-gray-600 uppercase tracking-wide mb-2 font-semibold">
              Current Session
            </div>
            <div className="text-2xl font-bold text-gray-800 font-mono">
              {formatTime(sessionTime)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-l-blue-500">
            <div className="text-sm text-gray-600 uppercase tracking-wide mb-2 font-semibold">
              Today Total
            </div>
            <div className="text-2xl font-bold text-gray-800 font-mono">
              {formatTime(todayTime)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-l-orange-500">
            <div className="text-sm text-gray-600 uppercase tracking-wide mb-2 font-semibold">
              This Week
            </div>
            <div className="text-2xl font-bold text-gray-800 font-mono">
              {formatTime(weekTime)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {isTracking ? (
            <Button 
              onClick={pauseTracking}
              variant="destructive"
              size="sm"
              className="rounded-full"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button 
              onClick={resumeTracking}
              variant="default"
              size="sm"
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          
          <Button 
            onClick={resetSession}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Session
          </Button>
        </div>

        {/* Status */}
        <div className={`text-center p-3 rounded-lg font-semibold ${
          status === 'active' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : status === 'paused'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-orange-50 text-orange-800 border border-orange-200'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'active' ? 'bg-green-500 animate-pulse' : 
              status === 'paused' ? 'bg-red-500' : 'bg-orange-500'
            }`}></div>
            <span>{statusText}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTimeTracker;
