import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Trophy, Brain } from 'lucide-react';
import { generateQuiz as fetchQuiz, BackendQuizResponse } from '@/lib/api';
import { useQuizAttempts } from "@/hooks/useQuizAttempts";

// ===============================
// Types
// ===============================
interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'cloze';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'grammar' | 'vocabulary' | 'comprehension';
}

interface QuizGeneratorProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onProgress: (score: number, sessionTime?: number) => void;
}

// How many questions we want each run
const QUESTIONS_PER_QUIZ = 5;

// ===============================
// Component
// ===============================
const QuizGenerator: React.FC<QuizGeneratorProps> = ({ difficulty, onProgress }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [clozeAnswers, setClozeAnswers] = useState<string[][]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [backendSource, setBackendSource] = useState<string | null>(null);
  const { persistQuiz, recordAttempt } = useQuizAttempts();
  const [quizId, setQuizId] = useState<string | null>(null);

  // UPDATED useEffect with enhanced API call for harder questions
  useEffect(() => {
    const loadQuiz = async () => {
      console.log("🚀 Frontend: Starting quiz generation for difficulty:", difficulty);
      setError(null);
      setIsLoading(true);
      
      try {
        // Generate unique identifiers for this quiz session
        const timestamp = Date.now();
        const sessionId = `quiz_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('[Quiz] Starting new quiz generation:', { timestamp, sessionId, difficulty });
        
        // CRITICAL CHANGES: Request harder questions with variety
        const backendQuiz = await fetchQuiz({
          topic: 'Advanced English Grammar',  // Changed to advanced
          grade: 'Grade 6-7',  // Transition level
          num_questions: QUESTIONS_PER_QUIZ,
          skills: ['complex grammar', 'advanced vocabulary', 'critical comprehension'],  // Enhanced skills
          difficulty: difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'challenging',  // Bump up difficulty
          unit: `Session ${sessionId}`,
          query: 'PSAC Grade 6-7 Advanced English',  // Advanced query
          seed: Math.floor(Math.random() * 1000000),  // Random seed for variety
          timestamp: timestamp,
          session_id: sessionId
        });
        
        console.log("📥 Frontend: Raw API response:", backendQuiz);
        console.log("📊 Frontend: Response source:", backendQuiz.source);
        console.log("📝 Frontend: Items received:", backendQuiz.items?.length || 0);
        console.log("🎯 Frontend: First question preview:", backendQuiz.items?.[0]?.question?.substring(0, 60));
        
        // Check if we got AI-generated questions
        if (backendQuiz.source === "llm" && backendQuiz.items && backendQuiz.items.length > 0) {
          console.log("✅ SUCCESS: Using AI-generated questions!");
          
          const mapped = backendQuiz.items.map((it, idx) => {
            console.log(`Mapping AI item ${idx}:`, it);
            
            const questionType = it.type === "mcq" ? "multiple-choice" as const : "cloze" as const;
            
            let correctAnswer = String(it.answer ?? "");
            if (it.type === "mcq" && Array.isArray(it.options) && it.options.length > 0) {
              if (typeof it.answer === "number" && it.answer >= 0 && it.answer < it.options.length) {
                correctAnswer = it.options[it.answer];
              } else if (typeof it.answer === "string") {
                const foundIndex = it.options.findIndex(opt => opt.toLowerCase() === it.answer.toLowerCase());
                if (foundIndex >= 0) {
                  correctAnswer = it.options[foundIndex];
                }
              }
            }
            
            return {
              id: it.id || `ai-${idx}`,
              type: questionType,
              question: String(it.question || ''),
              options: Array.isArray(it.options) ? it.options : [],
              correctAnswer: correctAnswer,
              explanation: String(it.explanation ?? "Generated by AI"),
              difficulty: difficulty,
              category: "grammar" as const,
            };
          });
          
          const validMapped = mapped.filter(q => {
            const isValid = q.question && q.question.trim() && 
              (q.type === "multiple-choice" ? (q.options && q.options.length >= 2 && q.correctAnswer) : q.correctAnswer);
            if (!isValid) {
              console.warn("Invalid AI question:", q);
            }
            return isValid;
          });
          
          if (validMapped.length > 0) {
            console.log(`✅ Using ${validMapped.length} AI-generated questions`);
            setShuffledQuestions(validMapped.slice(0, QUESTIONS_PER_QUIZ));
            setBackendSource("llm");
            
            // Track to detect repetition (for debugging)
            if (window.localStorage) {
              const lastFirstQuestion = window.localStorage.getItem('last_first_question');
              const currentFirstQuestion = validMapped[0]?.question;
              
              if (lastFirstQuestion === currentFirstQuestion) {
                console.warn('[Quiz] WARNING: Same first question as last time!');
                console.warn('[Quiz] Try clearing cache: localStorage.clear()');
              } else {
                console.log('[Quiz] ✅ Different first question from last time');
              }
              
              // Check if it's the dreaded synonym question
              if (currentFirstQuestion?.toLowerCase().includes("synonym") && 
                  currentFirstQuestion?.toLowerCase().includes("happy")) {
                console.warn('[Quiz] ⚠️ Got the repetitive synonym question! Backend may need restart.');
              }
              
              window.localStorage.setItem('last_first_question', currentFirstQuestion || '');
              window.localStorage.setItem('last_quiz_time', timestamp.toString());
            }
            
            // Persist the AI quiz
            try {
              if (backendQuiz) {
                const saved = await persistQuiz(backendQuiz);
                setQuizId(saved.id);
                console.log("✅ AI quiz saved with ID:", saved.id);
              }
            } catch (err) {
              console.warn('Failed to save AI quiz:', err);
            }
          } else {
            throw new Error("AI questions were invalid after mapping");
          }
        } else {
          // Backend returned fallback or no items
          throw new Error(`Backend returned: ${backendQuiz.source || 'unknown'} with ${backendQuiz.items?.length || 0} items`);
        }
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("❌ Frontend: AI quiz generation failed:", error);
        console.log("📚 Frontend: Using challenging fallback questions");
        
        // Use challenging fallback questions
        setError(`Using fallback questions (${error.message})`);
        const fallbackQuestions = generateChallengingFallback(difficulty);
        setShuffledQuestions(fallbackQuestions.slice(0, QUESTIONS_PER_QUIZ));
        setBackendSource("fallback");
      } finally {
        setIsLoading(false);
      }

      // Reset session data
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setClozeAnswers(Array(QUESTIONS_PER_QUIZ).fill([]));
      setShowResults(false);
      setScore(0);
      setStartTime(Date.now());
      setSessionTime(0);
      setFeedback('');
      setShowExplanation(false);
    };

    loadQuiz();
  }, [difficulty, persistQuiz]);

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startTime]);

  // Challenging fallback questions
  const generateChallengingFallback = (diff: string): QuizQuestion[] => {
    const challengingQuestions: QuizQuestion[] = [
      {
        id: 'fallback-1',
        type: 'multiple-choice',
        question: 'Which sentence demonstrates correct use of the subjunctive mood?',
        options: [
          'If I was rich, I would travel.',
          'If I were rich, I would travel.',
          'If I am rich, I would travel.',
          'If I will be rich, I would travel.'
        ],
        correctAnswer: 'If I were rich, I would travel.',
        explanation: 'The subjunctive mood uses "were" for hypothetical situations.',
        difficulty: 'hard',
        category: 'grammar'
      },
      {
        id: 'fallback-2',
        type: 'multiple-choice',
        question: 'Identify the type of figurative language: "The homework was a mountain of impossibility."',
        options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'],
        correctAnswer: 'Metaphor',
        explanation: 'This is a metaphor - direct comparison without "like" or "as".',
        difficulty: 'hard',
        category: 'comprehension'
      },
      {
        id: 'fallback-3',
        type: 'multiple-choice',
        question: 'Which sentence contains a dangling modifier?',
        options: [
          'Running quickly, John caught the bus.',
          'Walking through the park, the flowers were beautiful.',
          'After studying hard, she passed the exam.',
          'While eating dinner, we watched TV.'
        ],
        correctAnswer: 'Walking through the park, the flowers were beautiful.',
        explanation: 'The modifier "Walking through the park" incorrectly seems to modify "flowers".',
        difficulty: 'hard',
        category: 'grammar'
      },
      {
        id: 'fallback-4',
        type: 'multiple-choice',
        question: 'Choose the word that completes the analogy: Doctor : Hospital :: Teacher : ?',
        options: ['Student', 'Classroom', 'Book', 'Learning'],
        correctAnswer: 'Classroom',
        explanation: 'A doctor works in a hospital, just as a teacher works in a classroom.',
        difficulty: 'medium',
        category: 'vocabulary'
      },
      {
        id: 'fallback-5',
        type: 'multiple-choice',
        question: 'Which sentence uses parallel structure correctly?',
        options: [
          'She likes reading, to swim, and biking.',
          'She likes reading, swimming, and biking.',
          'She likes to read, swimming, and to bike.',
          'She likes read, swim, and biking.'
        ],
        correctAnswer: 'She likes reading, swimming, and biking.',
        explanation: 'Parallel structure requires consistent grammatical forms.',
        difficulty: 'hard',
        category: 'grammar'
      }
    ];
    
    // Shuffle the questions
    return challengingQuestions.sort(() => Math.random() - 0.5);
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const handleMultipleChoiceAnswer = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleClozeAnswer = (qIndex: number, blankIndex: number, value: string) => {
    setClozeAnswers(prev => {
      const updated = prev.map(arr => [...arr]);
      if (!updated[qIndex]) updated[qIndex] = [];
      updated[qIndex][blankIndex] = value;
      return updated;
    });
  };

  const validateAnswer = async (userAnswer: string, correctAnswer: string): Promise<{ isCorrect: boolean; feedback: string }> => {
    if (currentQuestion.type === 'cloze') {
      const userParts = (userAnswer || '').split(',').map(s => s.trim().toLowerCase());
      const correctParts = (correctAnswer || '').split(',').map(s => s.trim().toLowerCase());
      if (userParts.length !== correctParts.length) {
        return { isCorrect: false, feedback: `Please fill in all blanks. (${userParts.length}/${correctParts.length})` };
      }
      const allCorrect = correctParts.every((ans, idx) => userParts[idx] === ans);
      if (allCorrect) {
        return { isCorrect: true, feedback: 'Correct! Well done!' };
      } else {
        const diff = userParts.map((ans, idx) => ans === correctParts[idx] ? '✓' : `✗ (${ans} → ${correctParts[idx]})`).join(' ');
        return { isCorrect: false, feedback: `Some answers are incorrect. ${diff}` };
      }
    } else {
      const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      return isCorrect
        ? { isCorrect: true, feedback: 'Correct! Well done!' }
        : { isCorrect: false, feedback: `Incorrect. The correct answer is: ${correctAnswer}` };
    }
  };

  const handleNextQuestion = async () => {
    // Log the student's attempt for the current item before moving on
    try {
      if (quizId && currentQuestion) {
        let userAnswer = '';
        if (currentQuestion.type === 'multiple-choice') {
          userAnswer = selectedAnswers[currentQuestionIndex] || '';
        } else if (currentQuestion.type === 'cloze') {
          userAnswer = Array.isArray(clozeAnswers[currentQuestionIndex])
            ? clozeAnswers[currentQuestionIndex].join(',')
            : '';
        }

        await recordAttempt({
          quiz_id: quizId,
          item_id: currentQuestion.id,
          skill: currentQuestion.category,
          user_answer: userAnswer,
          is_correct:
            userAnswer.trim().toLowerCase() ===
            currentQuestion.correctAnswer.trim().toLowerCase(),
          time_ms: sessionTime * 1000,
          user_id: null,
        });
      }
    } catch (err) {
      console.warn('Failed to record attempt:', err);
    }

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
      setFeedback('');
    } else {
      await handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    setIsLoading(true);

    let correctCount = 0;
    const total = shuffledQuestions.length;
    for (let i = 0; i < total; i++) {
      const q = shuffledQuestions[i];
      let userAnswer = '';
      if (q.type === 'multiple-choice') {
        userAnswer = selectedAnswers[i] || '';
      } else if (q.type === 'cloze') {
        userAnswer = Array.isArray(clozeAnswers[i]) ? clozeAnswers[i].join(',') : '';
      }
      const validation = await validateAnswer(userAnswer, q.correctAnswer);
      if (validation.isCorrect) correctCount++;
    }

    const finalScore = Math.round((correctCount / total) * 100);
    setScore(finalScore);
    setShowResults(true);
    setIsLoading(false);

    onProgress(finalScore, sessionTime);
  };

  const renderMultipleChoiceQuestion = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{currentQuestion.question}</h3>
      <div className="space-y-3">
        {currentQuestion.options?.map((option, index) => (
          <Button
            key={index}
            variant={selectedAnswers[currentQuestionIndex] === option ? "default" : "outline"}
            className="w-full justify-start text-left h-auto p-4"
            onClick={() => handleMultipleChoiceAnswer(option)}
          >
            <span className="mr-3 font-medium">{String.fromCharCode(65 + index)}.</span>
            {option}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderClozeQuestion = () => {
    const parts = currentQuestion.question.split('_____');
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-gray-800">
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < parts.length - 1 && (
                <input
                  type="text"
                  className="mx-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your answer"
                  value={clozeAnswers[currentQuestionIndex]?.[index] || ''}
                  onChange={(e) => handleClozeAnswer(currentQuestionIndex, index, e.target.value)}
                />
              )}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        {score >= 80 ? (
          <Trophy className="w-16 h-16 text-yellow-500" />
        ) : score >= 60 ? (
          <CheckCircle className="w-16 h-16 text-green-500" />
        ) : (
          <Brain className="w-16 h-16 text-blue-500" />
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">
          {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job!' : 'Keep Practicing!'}
        </h2>
        <p className="text-lg text-gray-600">
          You scored {score}% ({Math.round((score / 100) * shuffledQuestions.length)} out of {shuffledQuestions.length} correct)
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Time taken: {Math.floor(sessionTime / 60)}m {sessionTime % 60}s
        </p>
      </div>
    </div>
  );

  if (!shuffledQuestions || shuffledQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-gray-500">Loading challenging questions...</span>
      </div>
    );
  }

  if (showResults) {
    return (
      <Card className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-700">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent>{renderResults()}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-blue-700">
            Advanced Quiz {backendSource === 'llm' ? '(AI-Generated)' : '(Challenging Questions)'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / shuffledQuestions.length) * 100)}% Complete</span>
          </div>
          <Progress value={(currentQuestionIndex + 1) / shuffledQuestions.length * 100} className="h-2" />
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize">{currentQuestion.category}</Badge>
          <Badge variant="outline" className="capitalize">{currentQuestion.type.replace('-', ' ')}</Badge>
          <Badge variant="outline" className="capitalize">{currentQuestion.difficulty}</Badge>
        </div>

        {error && <div className="text-xs text-amber-600 mt-2">{error}</div>}
        {backendSource && (
          <div className="text-xs mt-2">
            {backendSource === "llm" ? (
              <span className="text-green-700 bg-green-100 px-2 py-1 rounded">AI-Generated (Advanced)</span>
            ) : backendSource === "fallback" ? (
              <span className="text-amber-700 bg-amber-100 px-2 py-1 rounded">Challenging Fallback</span>
            ) : null}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {currentQuestion.type === 'multiple-choice' ? renderMultipleChoiceQuestion() : renderClozeQuestion()}

        {feedback && (
          <Alert>
            <AlertDescription>{feedback}</AlertDescription>
          </Alert>
        )}

        {showExplanation && (
          <Alert className="bg-blue-50">
            <AlertDescription>
              <strong>Explanation:</strong> {currentQuestion.explanation}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Button onClick={async () => {
            // Validate current question
            const q = currentQuestion;
            let userAnswer = '';
            if (q.type === 'multiple-choice') {
              userAnswer = (selectedAnswers[currentQuestionIndex] || '');
            } else if (q.type === 'cloze') {
              userAnswer = (clozeAnswers[currentQuestionIndex] || []).join(',');
            }
            const res = await validateAnswer(userAnswer, q.correctAnswer);
            setFeedback(res.feedback);
            setShowExplanation(!res.isCorrect ? true : false);
            await handleNextQuestion();
          }}>
            {currentQuestionIndex === shuffledQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizGenerator;