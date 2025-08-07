import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StudentProgress {
  id?: string;
  user_id: string;
  topic: string;
  current_difficulty: number;
  accuracy: number;
  avg_response_time: number;
  hints_used: number;
  total_questions: number;
  correct_answers: number;
  last_updated: string;
}

export interface QuestionHistory {
  id?: string;
  user_id: string;
  topic: string;
  question_id?: string;
  question_text: string;
  user_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  response_time: number;
  difficulty_level: number;
  hints_used: number;
  ai_generated: boolean;
  created_at: string;
}

export interface AIQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export const useAdaptiveDifficulty = (topic: string) => {
  const { user } = useAuth();
  const [currentProgress, setCurrentProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  // Fetch current progress for the topic
  const fetchProgress = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic', topic)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      setCurrentProgress(data || null);
    } catch (error) {
      console.error('Error fetching adaptive progress:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  }, [user, topic]);

  // Start tracking time for a question
  const startQuestionTimer = useCallback(() => {
    setQuestionStartTime(Date.now());
  }, []);

  // Get elapsed time in seconds
  const getElapsedTime = useCallback(() => {
    if (!questionStartTime) return 0;
    return (Date.now() - questionStartTime) / 1000;
  }, [questionStartTime]);

  // Update student progress with adaptive difficulty logic
  const updateStudentProgress = useCallback(async (
    isCorrect: boolean,
    responseTime: number,
    hintsUsed: number = 0,
    questionData?: {
      questionId?: string;
      questionText: string;
      userAnswer?: string;
      correctAnswer: string;
      aiGenerated?: boolean;
    }
  ) => {
    if (!user) return null;

    try {
      // Call the database function that handles adaptive difficulty logic
      const { data: newDifficulty, error } = await supabase
        .rpc('update_student_progress_adaptive', {
          p_user_id: user.id,
          p_topic: topic,
          p_is_correct: isCorrect,
          p_response_time: responseTime,
          p_hints_used: hintsUsed
        });

      if (error) throw error;

      // Log question history if question data is provided
      if (questionData) {
        await supabase
          .from('question_history')
          .insert({
            user_id: user.id,
            topic: topic,
            question_id: questionData.questionId,
            question_text: questionData.questionText,
            user_answer: questionData.userAnswer,
            correct_answer: questionData.correctAnswer,
            is_correct: isCorrect,
            response_time: responseTime,
            difficulty_level: newDifficulty || 1,
            hints_used: hintsUsed,
            ai_generated: questionData.aiGenerated || false
          });
      }

      // Refresh progress data
      await fetchProgress();

      // Check if difficulty changed
      if (currentProgress && newDifficulty !== currentProgress.current_difficulty) {
        const difficultyChange = newDifficulty - currentProgress.current_difficulty;
        if (difficultyChange > 0) {
          toast.success(`🎉 Level Up! You're now at difficulty ${newDifficulty}!`);
        } else {
          toast.info(`📚 Difficulty adjusted to level ${newDifficulty} to better match your needs.`);
        }
      }

      return newDifficulty;
    } catch (error) {
      console.error('Error updating student progress:', error);
      toast.error('Failed to save progress');
      return null;
    }
  }, [user, topic, currentProgress, fetchProgress]);

  // Generate AI question based on difficulty
  const generateAIQuestion = useCallback(async (
    difficulty: number,
    maxRetries: number = 3
  ): Promise<AIQuestion | null> => {
    if (!user) return null;

    const difficultyPrompts = {
      1: "Create an easy English vocabulary question suitable for 6th grade students. The question should test basic word meanings and simple grammar concepts.",
      2: "Create a medium-difficulty English question suitable for 6th grade students. The question should test intermediate vocabulary, grammar rules, and reading comprehension.",
      3: "Create a challenging English question suitable for advanced 6th grade students. The question should test complex vocabulary, advanced grammar concepts, and critical thinking."
    };

    const prompt = `${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}

Please provide a multiple choice question in this exact JSON format:
{
  "question": "The question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "The correct option (A, B, C, or D)",
  "explanation": "Brief explanation of why this is correct"
}

Make sure the response is valid JSON and the answer field contains only A, B, C, or D.`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are an English education expert. Always respond with valid JSON only.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 300
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No content in response');
        }

        // Try to parse the JSON response
        const questionData = JSON.parse(content);
        
        // Validate the question structure
        if (!questionData.question || !questionData.options || !questionData.answer) {
          throw new Error('Invalid question structure');
        }

        // Cache the question for future use
        await supabase
          .from('ai_question_cache')
          .upsert({
            topic: topic,
            difficulty_level: difficulty,
            question_text: questionData.question,
            options: questionData.options,
            correct_answer: questionData.answer,
            explanation: questionData.explanation,
            usage_count: 1
          }, {
            onConflict: 'topic,difficulty_level,question_text'
          });

        return questionData;
      } catch (error) {
        console.error(`AI question generation attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          // Try to get a cached question as fallback
          try {
            const { data: cachedQuestion } = await supabase
              .from('ai_question_cache')
              .select('*')
              .eq('topic', topic)
              .eq('difficulty_level', difficulty)
              .order('usage_count', { ascending: false })
              .limit(1)
              .single();

            if (cachedQuestion) {
              return {
                question: cachedQuestion.question_text,
                options: cachedQuestion.options,
                answer: cachedQuestion.correct_answer,
                explanation: cachedQuestion.explanation
              };
            }
          } catch (cacheError) {
            console.error('Failed to get cached question:', cacheError);
          }

          toast.error('Failed to generate question. Please try again.');
          return null;
        }
      }
    }

    return null;
  }, [user, topic]);

  // Get cached question for a difficulty level
  const getCachedQuestion = useCallback(async (difficulty: number): Promise<AIQuestion | null> => {
    try {
      const { data, error } = await supabase
        .from('ai_question_cache')
        .select('*')
        .eq('topic', topic)
        .eq('difficulty_level', difficulty)
        .order('usage_count', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        question: data.question_text,
        options: data.options,
        answer: data.correct_answer,
        explanation: data.explanation
      };
    } catch (error) {
      console.error('Error getting cached question:', error);
      return null;
    }
  }, [topic]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    currentProgress,
    loading,
    currentDifficulty: currentProgress?.current_difficulty || 1,
    accuracy: currentProgress?.accuracy || 0,
    avgResponseTime: currentProgress?.avg_response_time || 0,
    startQuestionTimer,
    getElapsedTime,
    updateStudentProgress,
    generateAIQuestion,
    getCachedQuestion,
    fetchProgress
  };
}; 