import { createContext, useContext } from "react";

export interface Word {
    id: string;
    text: string;
    position?: number;
}

export interface ProgressState {
    score: number;
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    sessionStartTime: number;
    sessionDuration: number;
    currentLevel: number;
    wordsMastered: number;
    consecutiveCorrect: number;
}

export interface ProgressContextType {
    progress: ProgressState;
    updateProgress: (updates: Partial<ProgressState>) => void;
    resetProgress: () => void;
}

export const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
    const context = useContext(ProgressContext);
    if (context === undefined) {
        throw new Error('useProgress must be used within a ProgressProvider');
    }
    return context;
};
