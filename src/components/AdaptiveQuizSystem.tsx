import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trophy, TrendingUp, TrendingDown, Target, Brain, Clock, CheckCircle, XCircle } from 'lucide-react';
import { generateQuiz, BackendQuizResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react'; // Add Home and ArrowLeft icons

// Type definitions for database operations
interface StudentProgress {
  current_difficulty?: number;
  accuracy?: string;
  avg_response_time?: string;
  total_questions?: number;
  correct_answers?: number;
}

interface QuestionHistory {
  user_id: string;
  topic: string;
  question_text?: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  response_time: number;
  difficulty_level: number;
  hints_used: number;
  ai_generated: boolean;
}

// Random topic and skill combinations for variety
const QUIZ_VARIATIONS = [
  { skills: ['grammar'], keywords: ['tenses', 'verbs', 'past', 'present', 'future'] },
  { skills: ['vocabulary'], keywords: ['synonyms', 'antonyms', 'meanings', 'definitions'] },
  { skills: ['grammar', 'vocabulary'], keywords: ['sentence structure', 'word choice'] },
  { skills: ['writing'], keywords: ['punctuation', 'capitalization', 'spelling'] },
  { skills: ['grammar'], keywords: ['pronouns', 'adjectives', 'adverbs', 'nouns'] },
  { skills: ['vocabulary'], keywords: ['prefixes', 'suffixes', 'word roots', 'word forms'] },
  // Removed comprehension-based variations
];

// Progressive difficulty multipliers
const PROGRESSIVE_DIFFICULTY = {
    vocabulary: {
      easy: ['basic', 'common', 'simple', 'everyday'],
      medium: ['intermediate', 'academic', 'formal', 'technical'],
      hard: ['advanced', 'sophisticated', 'complex', 'specialized']
    },
    complexity: {
      easy: 'Use short sentences with simple structures',
      medium: 'Use compound sentences with moderate complexity',
      hard: 'Use complex sentences with multiple clauses and advanced structures'
    }
  };

const DIFFICULTY_LEVELS = {
  1: { name: 'Easy', color: 'bg-green-500', prompt: 'basic', threshold: { up: 85, down: 50 } },
  2: { name: 'Medium', color: 'bg-yellow-500', prompt: 'intermediate', threshold: { up: 80, down: 40 } },
  3: { name: 'Hard', color: 'bg-red-500', prompt: 'advanced', threshold: { up: 75, down: 35 } }
};

export default function AdaptiveQuizSystem() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  
  // Quiz state
  const [currentQuiz, setCurrentQuiz] = useState<BackendQuizResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Performance tracking
  const [currentDifficulty, setCurrentDifficulty] = useState(2); // Start at medium
  const [performance, setPerformance] = useState({
    accuracy: 0,
    avgResponseTime: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0
  });
  
  // Timer state
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);

  // Add this right after your state declarations
  useEffect(() => {
    console.log('currentQuiz state:', currentQuiz);
    console.log('showResults state:', showResults);
    console.log('isLoading state:', isLoading);
  }, [currentQuiz, showResults, isLoading]);

  // Initialize user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadUserProgress(user.id);
      }
    };
    getUser();
  }, []);

  // Load user's adaptive difficulty progress
  const loadUserProgress = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('student_progress' as never)
        .select('*')
        .eq('user_id', uid)
        .eq('topic', 'adaptive_quiz')
        .single();

      if (data && !error) {
        const progressData = data as StudentProgress;
        setCurrentDifficulty(progressData.current_difficulty || 2);
        setPerformance({
          accuracy: parseFloat(progressData.accuracy || '0'),
          avgResponseTime: parseFloat(progressData.avg_response_time || '0'),
          totalQuestions: progressData.total_questions || 0,
          correctAnswers: progressData.correct_answers || 0,
          streak: 0,
          bestStreak: 0
        });
      }
    } catch (error) {
      console.log('No existing progress, starting fresh');
    }
  };

  // Generate a random quiz with current difficulty
  // Generate a random quiz with current difficulty
const generateRandomQuiz = async () => {
    setIsLoading(true);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuestionTimes([]);
    
    try {
      // Pick a random variation
      let variation = QUIZ_VARIATIONS[Math.floor(Math.random() * QUIZ_VARIATIONS.length)];
      
      // Calculate progressive difficulty
      // Within each level, make it progressively harder based on streak
      const progressiveModifier = Math.min(performance.streak * 0.1, 0.3); // Max 30% harder
      
      // Map difficulty levels to actual difficulty strings
      const difficultyMap = {
        1: 'easy',
        2: 'medium', 
        3: 'hard'
      };
      
      // Create difficulty-specific prompts that explicitly exclude passage-based questions
      const difficultyPrompts = {
        1: `Generate very simple Grade 6 English questions. Use common words and simple sentence structures. 
            DO NOT create reading comprehension questions or reference any passages.
            Focus on: vocabulary meanings, basic grammar, word usage, spelling.`,
        2: `Generate intermediate Grade 6 English questions with moderate complexity. 
            DO NOT create reading comprehension questions or reference any passages.
            Focus on: synonyms/antonyms, grammar rules, sentence structure, word forms.`,
        3: `Generate advanced Grade 6 English questions requiring critical thinking. 
            DO NOT create reading comprehension questions or reference any passages.
            Focus on: complex grammar, advanced vocabulary, word relationships, language analysis.`
      };
      
      // Add progressive difficulty within the level
      let enhancedPrompt = difficultyPrompts[currentDifficulty];
      if (performance.streak > 0) {
        enhancedPrompt += ` Make these questions ${Math.round(progressiveModifier * 100)}% more challenging than usual for this level.`;
      }
      if (performance.streak < 0) {
        enhancedPrompt += ` Make these questions slightly easier to build confidence.`;
      }
      
      // Build a small helper to call once with a seed and optional avoid list
      const fetchOnce = async (seed: number, avoidList: string[]) => {
        const sessionId = `smart_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const keywords = [...variation.keywords].sort(() => Math.random() - 0.5).slice(0, 3);
        const avoidText = avoidList.length > 0 ? ` Avoid reusing any of these exact question wordings: ${avoidList.slice(0,5).join(' | ')}` : '';
        return generateQuiz({
          skills: variation.skills.filter(skill => skill !== 'comprehension'),
          keywords,
          difficulty: difficultyMap[currentDifficulty],
          count: 5,
          grade: 'Grade 6',
          query: enhancedPrompt + ` Generate standalone questions that don't require any external text or passage.` + ` UNIQUE REQUEST ID: ${sessionId}.` + avoidText,
          topic: `${variation.skills.join(' and ')} - Level ${currentDifficulty}`,
          seed
        });
      };

      // Read last questions to avoid repetition
      const lastQuestions: string[] = JSON.parse(window.localStorage?.getItem('last_smart_quiz_questions') || '[]');

      // First attempt
      let quizData = await fetchOnce(Math.floor(Math.random() * 1_000_000), lastQuestions);

      // If repetition detected, try a different variation/seed once more
      if (quizData.items && quizData.items.length > 0) {
        const currentQuestions = quizData.items.map(i => String(i.question || ''));
        const overlap = currentQuestions.filter(q => lastQuestions.includes(q));
        const hasRepetition = overlap.length >= Math.min(2, currentQuestions.length);
        if (hasRepetition) {
          console.warn('[SmartQuiz] Repetition detected across runs, regenerating with new seed and variation.');
          // choose a different variation
          const alt = QUIZ_VARIATIONS.filter(v => v !== variation);
          if (alt.length > 0) variation = alt[Math.floor(Math.random() * alt.length)];
          quizData = await fetchOnce(Math.floor(Math.random() * 1_000_000), currentQuestions);
        }
        // Persist for next run comparison
        try {
          window.localStorage?.setItem('last_smart_quiz_questions', JSON.stringify(currentQuestions.slice(0, 5)));
        } catch {}
      }
  
      if (quizData.items && quizData.items.length > 0) {
        setCurrentQuiz(quizData);
        setQuestionStartTime(Date.now());
        
        // Show more detailed toast
        toast({
          title: "Quiz Ready!",
          description: `${quizData.items.length} ${DIFFICULTY_LEVELS[currentDifficulty].name} questions generated${performance.streak > 0 ? ` (Streak bonus: +${Math.round(progressiveModifier * 100)}% difficulty)` : ''}`,
        });
      } else {
        throw new Error('No questions generated');
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  // Submit answer and move to next question
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuiz) return;

    // Calculate response time
    const responseTime = (Date.now() - questionStartTime) / 1000;
    const newQuestionTimes = [...questionTimes, responseTime];
    setQuestionTimes(newQuestionTimes);
    
    // Save answer
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    
    // Check if this was the last question
    if (currentQuestionIndex === currentQuiz.items.length - 1) {
      await calculateResults(newAnswers, newQuestionTimes);
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setQuestionStartTime(Date.now());
    }
  };

  // Calculate results and update adaptive difficulty
  const calculateResults = async (answers: string[], times: number[]) => {
    if (!currentQuiz || !userId) {
      setShowResults(true);
      return;
    }

    let correct = 0;
    currentQuiz.items.forEach((item, index: number) => {
      const userAnswer = answers[index];
      let isCorrect = false;
      
      if (item.type === 'mcq' && item.options) {
        if (typeof item.answer === 'number') {
          isCorrect = userAnswer === item.options[item.answer];
        } else {
          const answerStr = Array.isArray(item.answer) ? item.answer.join(',') : String(item.answer);
          isCorrect = userAnswer.toLowerCase() === answerStr.toLowerCase();
        }
      }else if (item.type === 'fitb') {
        // Handle fill-in-the-blank questions
        const answerStr = Array.isArray(item.answer) ? item.answer.join(',') : String(item.answer);
        isCorrect = userAnswer.toLowerCase() === answerStr.toLowerCase();
      }
      
      if (isCorrect) correct++;
    });

    const accuracy = (correct / currentQuiz.items.length) * 100;
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;



    // Adaptive difficulty adjustment with progressive changes
    let newDifficulty = currentDifficulty;
    const threshold = DIFFICULTY_LEVELS[currentDifficulty].threshold;

    // Track consecutive successes/failures for progressive difficulty
    let newStreak = performance.streak;
    if (accuracy >= threshold.up) {
      newStreak = performance.streak + 1;
    } else if (accuracy < threshold.down) {
      newStreak = -1; // Reset to negative for failure
    } else {
      newStreak = 0; // Reset if performance is average
    }

    // Level changes based on consistent performance
    if (accuracy >= threshold.up && avgTime < 20) {
      if (currentDifficulty < 3 && newStreak >= 2) {
        // Need 2 consecutive good performances to level up
        newDifficulty = currentDifficulty + 1;
        newStreak = 0; // Reset streak after level change
        toast({
          title: "Level Up! 🎉",
          description: `Excellent work! Moving to ${DIFFICULTY_LEVELS[newDifficulty].name} difficulty`,
        });
      } else if (currentDifficulty === 3 && newStreak > 0) {
        // At max level, acknowledge continued excellence
        toast({
          title: "Outstanding! 🌟",
          description: `You're mastering the hardest level! Streak: ${newStreak}`,
        });
      }
    } else if (accuracy < threshold.down) {
      if (currentDifficulty > 1) {
        newDifficulty = currentDifficulty - 1;
        newStreak = 0;
        toast({
          title: "Difficulty Adjusted",
          description: `Let's practice more at ${DIFFICULTY_LEVELS[newDifficulty].name} level`,
        });
      }
    } else if (accuracy >= 60 && accuracy < threshold.up) {
      // Good but not great performance
      toast({
        title: "Good Job! 👍",
        description: `Keep practicing to level up! Need ${threshold.up}% to advance.`,
      });
    }

    // Update performance with new streak
    const newPerformance = {
      accuracy: ((performance.accuracy * performance.totalQuestions + accuracy) / (performance.totalQuestions + currentQuiz.items.length)),
      avgResponseTime: ((performance.avgResponseTime * performance.totalQuestions + avgTime * currentQuiz.items.length) / (performance.totalQuestions + currentQuiz.items.length)),
      totalQuestions: performance.totalQuestions + currentQuiz.items.length,
      correctAnswers: performance.correctAnswers + correct,
      streak: newStreak,
      bestStreak: Math.max(performance.bestStreak, Math.abs(newStreak))
    };

    setCurrentDifficulty(newDifficulty);
    setPerformance(newPerformance);

    // Save progress to database (commented out - tables don't exist in current schema)
    // try {
    //   await supabase.rpc('update_student_progress_adaptive' as never, {
    //     p_user_id: userId,
    //     p_topic: 'adaptive_quiz',
    //     p_is_correct: accuracy >= 60,
    //     p_response_time: avgTime,
    //     p_hints_used: 0
    //   });

    //   // Log each question to history
    //   for (let i = 0; i < currentQuiz.items.length; i++) {
    //     const item = currentQuiz.items[i];
    //     await supabase.from('question_history' as never).insert({
    //       user_id: userId,
    //       topic: 'adaptive_quiz',
    //       question_text: item.question,
    //       user_answer: answers[i],
    //       correct_answer: typeof item.answer === 'number' ? item.options[item.answer] : item.answer,
    //       is_correct: answers[i] === (typeof item.answer === 'number' ? item.options[item.answer] : item.answer),
    //       response_time: times[i],
    //       difficulty_level: currentDifficulty,
    //       hints_used: 0,
    //       ai_generated: true
    //     });
    //   }
    // } catch (error) {
    //   console.error('Failed to save progress:', error);
    // }

    setShowResults(true);
  };

  // Get current question
  const currentQuestion = currentQuiz?.items?.[currentQuestionIndex];

  if (showResults) {
    // First check if currentQuiz exists
    if (!currentQuiz || !currentQuiz.items) {
      return (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <p>No quiz data available. Please try again.</p>
            <Button onClick={() => {
              setShowResults(false);
              generateRandomQuiz();
            }} className="mt-4">
              Generate New Quiz
            </Button>
          </CardContent>
        </Card>
      );
    }
    const correct = userAnswers.filter((answer, index) => {
      const item = currentQuiz.items[index];
      if (item.type === 'mcq' && item.options) {
        if (typeof item.answer === 'number') {
          return answer === item.options[item.answer];
        }
      }
      const answerStr = Array.isArray(item.answer) ? item.answer.join(',') : String(item.answer);
      return answer.toLowerCase() === answerStr.toLowerCase();
    }).length;

    const accuracy = currentQuiz ? (correct / currentQuiz.items.length) * 100 : 0;

    return (
             <Card className="max-w-4xl mx-auto">
         <CardHeader>
           <CardTitle className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Trophy className="h-6 w-6 text-yellow-500" />
               Quiz Complete!
             </div>
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => navigate('/')}
             >
               Exit to Home
             </Button>
           </CardTitle>
         </CardHeader>
        <CardContent className="space-y-6">
          {/* Results Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{correct}/{currentQuiz.items.length}</p>
              <p className="text-sm text-gray-600">Correct Answers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{accuracy.toFixed(0)}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{(questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length).toFixed(1)}s</p>
              <p className="text-sm text-gray-600">Avg Time</p>
            </div>
            <div className="text-center">
              <Badge className={DIFFICULTY_LEVELS[currentDifficulty].color}>
                {DIFFICULTY_LEVELS[currentDifficulty].name}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Next Level</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            <h3 className="font-semibold">Review Your Answers:</h3>
            {currentQuiz.items.map((item, index: number) => {
              const userAnswer = userAnswers[index];
              const correctAnswer = item.type === 'mcq' && typeof item.answer === 'number' 
                ? item.options[item.answer] 
                : item.answer;
              const isCorrect = userAnswer === correctAnswer;

              return (
                <div key={index} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <div className="flex items-start gap-2">
                    {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600 mt-1" /> : <XCircle className="h-5 w-5 text-red-600 mt-1" />}
                    <div className="flex-1">
                      <p className="font-medium">{index + 1}. {item.question}</p>
                      <p className="text-sm mt-2">Your answer: <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span></p>
                      {!isCorrect && <p className="text-sm">Correct answer: <span className="text-green-700">{correctAnswer}</span></p>}
                      {item.explanation && <p className="text-sm text-gray-600 mt-1">{item.explanation}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Progress */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Overall Progress</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>Total Questions Attempted: {performance.totalQuestions}</p>
                <p>Overall Accuracy: {performance.accuracy.toFixed(1)}%</p>
              </div>
              <div>
                <p>Avg Response Time: {performance.avgResponseTime.toFixed(1)}s</p>
                <p>Current Streak: {performance.streak}</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => {
              console.log('Start New Quiz clicked');
              setShowResults(false);
              setCurrentQuestionIndex(0);
              setUserAnswers([]);
              setQuestionTimes([]);
              setCurrentQuiz(null); // Reset quiz first
              generateRandomQuiz();  
            }} 
            className="w-full" 
            size="lg"
          >
            Start New Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Please log in to access the quiz system.</p>
              <Button onClick={() => navigate('/auth')} className="mt-4">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should be the FIRST thing in your component's return
  if (!currentQuiz && !isLoading && showResults) {
    setShowResults(false);
    return null;
  }

  // Right at the start of your main return statement
  if (!currentQuiz && !isLoading) {
    // No quiz exists and we're not loading - show the start screen
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Brain className="h-16 w-16 mx-auto text-blue-500" />
              <h2 className="text-2xl font-semibold">Ready for a Challenge?</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Each quiz is randomly generated with questions that adapt to your skill level.
              </p>
              <Button 
                onClick={generateRandomQuiz} 
                size="lg"
              >
                Start Random Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only proceed if we have a quiz or are loading
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600">Generating quiz questions...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Now continue with the rest of your component
  // At this point, currentQuiz should exist
  return (
    <div className="max-w-4xl mx-auto space-y-6">
         <div className="flex items-center justify-between mb-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Home
      </Button>
      
      <h1 className="text-2xl font-bold">Smart Quiz</h1>
      
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Adaptive Quiz System</CardTitle>
              <CardDescription>Questions adjust to your performance level</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={DIFFICULTY_LEVELS[currentDifficulty].color}>
                {DIFFICULTY_LEVELS[currentDifficulty].name} Mode
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-600">Overall Accuracy</p>
                <p className="text-lg font-semibold">{performance.accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

             {/* Quiz Content */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Question {currentQuestionIndex + 1} of {currentQuiz.items.length}</CardTitle>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {Math.floor((Date.now() - questionStartTime) / 1000)}s
                </span>
              </div>
            </div>
            <Progress value={(currentQuestionIndex + 1) / currentQuiz.items.length * 100} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
                         {currentQuestion && (
               <>
                 <div className="flex justify-between items-center mb-4">
                   <div className="text-lg font-medium">{currentQuestion.question}</div>
                   <Badge variant="outline" className="flex items-center gap-1">
                     <Clock className="h-3 w-3" />
                     {Math.floor((Date.now() - questionStartTime) / 1000)}s
                   </Badge>
                 </div>
                
                {currentQuestion.type === 'mcq' && currentQuestion.options && (
                  <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label 
                            htmlFor={`option-${index}`} 
                            className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.type === 'fitb' && (
                  <input
                    type="text"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Type your answer here..."
                  />
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                      setSelectedAnswer(userAnswers[currentQuestionIndex - 1] || '');
                    }}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                  >
                    {currentQuestionIndex === currentQuiz.items.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      {/* Performance Stats */}
      {performance.totalQuestions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Target className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{performance.correctAnswers}</p>
                <p className="text-xs text-gray-600">Total Correct</p>
              </div>
              <div>
                <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{performance.bestStreak}</p>
                <p className="text-xs text-gray-600">Best Streak</p>
              </div>
              <div>
                <Brain className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{performance.totalQuestions}</p>
                <p className="text-xs text-gray-600">Questions Tried</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}