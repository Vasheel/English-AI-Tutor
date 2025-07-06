import { useState, useEffect, useRef } from 'react';

interface UseSessionTimerProps {
  onTimeUpdate?: (seconds: number) => void;
  autoStart?: boolean;
}

export const useSessionTimer = ({ onTimeUpdate, autoStart = true }: UseSessionTimerProps = {}) => {
  const [isActive, setIsActive] = useState(autoStart);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(elapsed);
        onTimeUpdate?.(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, onTimeUpdate]);

  const start = () => {
    setIsActive(true);
    startTimeRef.current = Date.now();
  };

  const stop = () => {
    setIsActive(false);
  };

  const reset = () => {
    setSeconds(0);
    startTimeRef.current = Date.now();
  };

  const getFormattedTime = () => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    seconds,
    isActive,
    start,
    stop,
    reset,
    getFormattedTime
  };
}; 