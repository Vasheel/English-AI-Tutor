// Utility functions for proper time calculation
export const TimeUtils = {
  // Convert milliseconds to seconds
  msToSeconds: (ms: number): number => {
    return Math.floor(ms / 1000);
  },

  // Convert milliseconds to minutes
  msToMinutes: (ms: number): number => {
    return Math.floor(ms / (1000 * 60));
  },

  // Get elapsed time in seconds from start time
  getElapsedTimeSeconds: (startTime: number): number => {
    const elapsed = Date.now() - startTime;
    return Math.max(1, Math.floor(elapsed / 1000)); // Minimum 1 second
  },

  // Get elapsed time in minutes from start time
  getElapsedTimeMinutes: (startTime: number): number => {
    const elapsed = Date.now() - startTime;
    return Math.max(1, Math.floor(elapsed / (1000 * 60))); // Minimum 1 minute
  },

  // Format time in human readable format
  formatTime: (seconds: number): string => {
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
  },

  // Validate and cap time values to prevent unrealistic times
  validateTimeSpent: (timeSpent: number, maxHours: number = 2): number => {
    const maxSeconds = maxHours * 3600; // Convert hours to seconds
    return Math.min(Math.max(timeSpent, 1), maxSeconds); // Min 1 second, max specified hours
  },

  // Calculate session time for activities
  calculateSessionTime: (startTime: number): number => {
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    return TimeUtils.validateTimeSpent(seconds, 1); // Max 1 hour per session
  }
};

// Hook for proper time tracking in activities
export const useActivityTimer = () => {
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [isActive, setIsActive] = useState(true);

  const startTimer = useCallback(() => {
    setSessionStartTime(Date.now());
    setIsActive(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsActive(true);
  }, []);

  const getElapsedTime = useCallback((): number => {
    if (!isActive) return 0;
    return TimeUtils.getElapsedTimeSeconds(sessionStartTime);
  }, [sessionStartTime, isActive]);

  const getElapsedTimeMinutes = useCallback((): number => {
    if (!isActive) return 0;
    return TimeUtils.getElapsedTimeMinutes(sessionStartTime);
  }, [sessionStartTime, isActive]);

  const resetTimer = useCallback(() => {
    setSessionStartTime(Date.now());
    setIsActive(true);
  }, []);

  return {
    sessionStartTime,
    isActive,
    startTimer,
    pauseTimer,
    resumeTimer,
    getElapsedTime,
    getElapsedTimeMinutes,
    resetTimer
  };
};
