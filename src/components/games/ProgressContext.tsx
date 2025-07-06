import { useState, useEffect } from "react";
import { ProgressContext, ProgressContextType, ProgressState } from "./ProgressContextExports";

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => {
    const savedProgress = localStorage.getItem('sentenceBuilderProgress');
    return savedProgress ? JSON.parse(savedProgress) : {
      score: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      sessionStartTime: Date.now(),
      sessionDuration: 0,
      currentLevel: 1,
      wordsMastered: 0,
      consecutiveCorrect: 0
    };
  });

  const updateProgress = (updates: Partial<ProgressState>) => {
    setProgress(prev => ({
      ...prev,
      ...updates,
      accuracy: prev.totalAttempts > 0 ? Math.round((prev.correctAttempts / prev.totalAttempts) * 100) : 0,
      sessionDuration: Date.now() - prev.sessionStartTime
    }));
  };

  const resetProgress = () => {
    setProgress({
      score: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      sessionStartTime: Date.now(),
      sessionDuration: 0,
      currentLevel: 1,
      wordsMastered: 0,
      consecutiveCorrect: 0
    });
    localStorage.removeItem('sentenceBuilderProgress');
  };

  useEffect(() => {
    localStorage.setItem('sentenceBuilderProgress', JSON.stringify(progress));
  }, [progress]);

  return (
    <ProgressContext.Provider value={{ progress, updateProgress, resetProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}
