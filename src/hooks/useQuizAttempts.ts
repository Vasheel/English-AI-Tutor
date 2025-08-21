// client/src/hooks/useQuizAttempts.ts
import { useCallback } from "react";
import { logAttempt, saveQuiz, getNextDifficulty } from "../lib/api";

// Hook that lets you save quizzes, log attempts, and get adaptive difficulty suggestions
export function useQuizAttempts() {
  // Save a full quiz JSON into Supabase via backend
  const persistQuiz = useCallback(async (quiz: Parameters<typeof saveQuiz>[0]) => {
    return saveQuiz(quiz);
  }, []);

  // Record a student's attempt at a question
  const recordAttempt = useCallback(async (args: {
    quiz_id: string;
    item_id: string;
    skill: string;
    user_answer: string;
    is_correct: boolean;
    time_ms?: number;
    user_id?: string | null;
  }) => {
    return logAttempt(args);
  }, []);

  // Ask the backend what difficulty the student should attempt next
  const suggestDifficulty = useCallback(async (user_id: string, skill: string) => {
    return getNextDifficulty(user_id, skill);
  }, []);

  return { persistQuiz, recordAttempt, suggestDifficulty };
}
