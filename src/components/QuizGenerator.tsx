import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Trophy, Brain, RefreshCw } from 'lucide-react';
import { generateAIQuestions, clearAICache, getAICacheStats } from '@/utils/aiQuestionGenerator';

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

// Dynamic question generation with variety
const generateDynamicQuestions = (difficulty: 'easy' | 'medium' | 'hard'): QuizQuestion[] => {
  const baseQuestions: QuizQuestion[] = [
    // Multiple Choice Grammar Questions
    {
      id: 'mcq-1',
      type: 'multiple-choice',
      question: 'Choose the correct form of the verb: "She _____ to school every day."',
      options: ['go', 'goes', 'going', 'gone'],
      correctAnswer: 'goes',
      explanation: 'The correct answer is "goes" because it follows the third person singular rule in present simple tense.',
      difficulty: 'easy',
      category: 'grammar'
    },
    {
      id: 'mcq-2',
      type: 'multiple-choice',
      question: 'Which sentence uses the correct article?',
      options: ['I saw a elephant at zoo.', 'I saw an elephant at the zoo.', 'I saw elephant at zoo.', 'I saw an elephant at zoo.'],
      correctAnswer: 'I saw an elephant at the zoo.',
      explanation: 'We use "an" before words starting with vowel sounds, and "the" before specific nouns like "zoo".',
      difficulty: 'easy',
      category: 'grammar'
    },
    {
      id: 'mcq-3',
      type: 'multiple-choice',
      question: 'Select the correct plural form: "The _____ are flying in the sky."',
      options: ['bird', 'birds', 'birdes', 'bird\'s'],
      correctAnswer: 'birds',
      explanation: 'The plural form of "bird" is "birds" - we simply add "s" to make it plural.',
      difficulty: 'easy',
      category: 'grammar'
    },
    {
      id: 'mcq-4',
      type: 'multiple-choice',
      question: 'Which word is a synonym for "happy"?',
      options: ['sad', 'joyful', 'angry', 'tired'],
      correctAnswer: 'joyful',
      explanation: '"Joyful" is a synonym for "happy" as both words express positive emotions.',
      difficulty: 'easy',
      category: 'vocabulary'
    },
    {
      id: 'mcq-5',
      type: 'multiple-choice',
      question: 'Complete the sentence: "If it rains tomorrow, I _____ stay at home."',
      options: ['will', 'would', 'am', 'have'],
      correctAnswer: 'will',
      explanation: 'We use "will" to express future intention or decision made at the moment of speaking.',
      difficulty: 'medium',
      category: 'grammar'
    },
    
    // Cloze Questions (Passage Fill-in)
    {
      id: 'cloze-1',
      type: 'cloze',
      question: 'Complete the passage:\n\nTom is a student. He _____ to school every morning. His school _____ near his house. He _____ his friends there and they _____ together.',
      correctAnswer: 'goes,is,meets,study',
      explanation: 'The passage requires present simple tense verbs: "goes" (3rd person), "is" (location), "meets" (3rd person), "study" (plural subject).',
      difficulty: 'easy',
      category: 'grammar'
    },
    {
      id: 'cloze-2',
      type: 'cloze',
      question: 'Fill in the blanks:\n\nThe weather _____ beautiful today. The sun _____ shining and birds _____ singing. It\'s a perfect day for a _____ in the park.',
      correctAnswer: 'is,is,are,walk',
      explanation: 'Present continuous tense for ongoing actions: "is" (weather), "is" (sun), "are" (birds), and "walk" as a noun.',
      difficulty: 'medium',
      category: 'grammar'
    },
    {
      id: 'cloze-3',
      type: 'cloze',
      question: 'Complete the story:\n\nYesterday, Sarah _____ to the library. She _____ a book about animals. The book _____ very interesting. She _____ it for two hours.',
      correctAnswer: 'went,bought,was,read',
      explanation: 'Past simple tense: "went" (go), "bought" (buy), "was" (be), "read" (read).',
      difficulty: 'medium',
      category: 'grammar'
    },
    // Additional Multiple Choice Questions
    {
      id: 'mcq-6',
      type: 'multiple-choice',
      question: 'Which word is the opposite of "difficult"?',
      options: ['easy', 'hard', 'tough', 'strong'],
      correctAnswer: 'easy',
      explanation: 'The opposite of "difficult" is "easy".',
      difficulty: 'easy',
      category: 'vocabulary'
    },
    {
      id: 'mcq-7',
      type: 'multiple-choice',
      question: 'Choose the correct preposition: "He is good ___ math."',
      options: ['at', 'in', 'on', 'with'],
      correctAnswer: 'at',
      explanation: 'The correct preposition is "at" (good at something).',
      difficulty: 'easy',
      category: 'grammar'
    },
    {
      id: 'mcq-8',
      type: 'multiple-choice',
      question: 'Which sentence is correct?',
      options: ['She don\'t like apples.', 'She doesn\'t likes apples.', 'She doesn\'t like apples.', 'She not like apples.'],
      correctAnswer: 'She doesn\'t like apples.',
      explanation: 'The correct negative form is "doesn\'t like" for third person singular.',
      difficulty: 'easy',
      category: 'grammar'
    },
    // Additional Cloze Questions
    {
      id: 'cloze-4',
      type: 'cloze',
      question: 'Fill in the blanks:\n\nMy father _____ (drive) to work every day. He _____ (not/use) the bus because it _____ (take) too long.',
      correctAnswer: 'drives,does not use,takes',
      explanation: 'Present simple tense: "drives", "does not use", "takes".',
      difficulty: 'easy',
      category: 'grammar'
    },
    {
      id: 'cloze-5',
      type: 'cloze',
      question: 'Complete the passage:\n\nThe children _____ (play) in the garden. Their mother _____ (watch) them from the window.',
      correctAnswer: 'are playing,is watching',
      explanation: 'Present continuous tense: "are playing", "is watching".',
      difficulty: 'easy',
      category: 'grammar'
    },
    {
      id: 'cloze-6',
      type: 'cloze',
      question: 'Fill in the blanks:\n\nYesterday, we _____ (go) to the zoo. We _____ (see) many animals and _____ (have) a lot of fun.',
      correctAnswer: 'went,saw,had',
      explanation: 'Past simple tense: "went", "saw", "had".',
      difficulty: 'easy',
      category: 'grammar'
    },
    // Medium difficulty questions
    {
      id: 'mcq-9',
      type: 'multiple-choice',
      question: 'Which sentence uses the correct conditional form?',
      options: ['If I will see him, I will tell him.', 'If I see him, I will tell him.', 'If I saw him, I will tell him.', 'If I see him, I tell him.'],
      correctAnswer: 'If I see him, I will tell him.',
      explanation: 'First conditional: present simple in if-clause, will + base form in main clause.',
      difficulty: 'medium',
      category: 'grammar'
    },
    {
      id: 'mcq-10',
      type: 'multiple-choice',
      question: 'Choose the correct passive voice: "The letter _____ by John yesterday."',
      options: ['writes', 'wrote', 'was written', 'is written'],
      correctAnswer: 'was written',
      explanation: 'Past simple passive: was/were + past participle.',
      difficulty: 'medium',
      category: 'grammar'
    },
    // Hard difficulty questions
    {
      id: 'mcq-11',
      type: 'multiple-choice',
      question: 'Which sentence demonstrates the subjunctive mood?',
      options: ['I wish I was rich.', 'I wish I were rich.', 'I am rich.', 'I will be rich.'],
      correctAnswer: 'I wish I were rich.',
      explanation: 'The subjunctive "were" is used after "wish" for hypothetical situations.',
      difficulty: 'hard',
      category: 'grammar'
    },
    {
      id: 'mcq-12',
      type: 'multiple-choice',
      question: 'Identify the gerund in the sentence: "Swimming is my favorite sport."',
      options: ['Swimming', 'is', 'my', 'sport'],
      correctAnswer: 'Swimming',
      explanation: '"Swimming" is a gerund (verb form ending in -ing used as a noun).',
      difficulty: 'hard',
      category: 'grammar'
    }
  ];

  // Filter questions by difficulty and shuffle them
  const filteredQuestions = baseQuestions.filter(q => q.difficulty === difficulty);
  return shuffleArray(filteredQuestions);
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const QUESTIONS_PER_QUIZ = 3;

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

  useEffect(() => {
    // Generate AI questions first, fallback to static content
    const generateQuestions = async () => {
      try {
        // Generate AI questions for different categories
        const grammarQuestions = await generateAIQuestions(difficulty, 'grammar', 2);
        const vocabularyQuestions = await generateAIQuestions(difficulty, 'vocabulary', 1);
        
        // Combine AI questions with fallback questions
        const aiQuestions = [...grammarQuestions, ...vocabularyQuestions];
        const fallbackQuestions = generateDynamicQuestions(difficulty);
        
        // Convert AI questions to QuizQuestion format
        const convertedAIQuestions: QuizQuestion[] = aiQuestions.map((q, index) => ({
          id: q.id || `ai-${index}`,
          type: q.type,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          category: q.category
        }));
        
        // Use AI questions first, then fallback if needed
        const allQuestions = [...convertedAIQuestions, ...fallbackQuestions];
        const shuffled = shuffleArray(allQuestions);
        
        setShuffledQuestions(shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length)));
      } catch (error) {
        console.error('AI question generation failed, using fallback:', error);
        // Use fallback questions if AI fails
        const dynamicQuestions = generateDynamicQuestions(difficulty);
        const shuffled = shuffleArray(dynamicQuestions);
        setShuffledQuestions(shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length)));
      }
      
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

    generateQuestions();
  }, [difficulty]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

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
        const feedback = userParts.map((ans, idx) => ans === correctParts[idx] ? '✔️' : `❌ (${ans} → ${correctParts[idx]})`).join(' ');
        return { isCorrect: false, feedback: `Some answers are incorrect. ${feedback}` };
      }
    } else {
      const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      if (isCorrect) {
        return { isCorrect: true, feedback: 'Correct! Well done!' };
      } else {
        return { isCorrect: false, feedback: `Incorrect. The correct answer is: ${correctAnswer}` };
      }
    }
  };

  const handleNextQuestion = async () => {
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
    const totalQuestions = shuffledQuestions.length;
    for (let i = 0; i < totalQuestions; i++) {
      const question = shuffledQuestions[i];
      let userAnswer = '';
      if (question.type === 'multiple-choice') {
        userAnswer = selectedAnswers[i] || '';
      } else if (question.type === 'cloze') {
        userAnswer = Array.isArray(clozeAnswers[i]) ? clozeAnswers[i].join(',') : '';
      }
      const validation = await validateAnswer(userAnswer, question.correctAnswer);
      if (validation.isCorrect) {
        correctCount++;
      }
    }

    const finalScore = Math.round((correctCount / totalQuestions) * 100);
    setScore(finalScore);
    setShowResults(true);
    setIsLoading(false);

    onProgress(finalScore, sessionTime);
  };

  const resetQuiz = () => {
    const dynamicQuestions = generateDynamicQuestions(difficulty);
    const shuffled = shuffleArray(dynamicQuestions);
    setShuffledQuestions(shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length)));
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setClozeAnswers(Array(shuffled.length).fill([]));
    setShowResults(false);
    setScore(0);
    setStartTime(Date.now());
    setSessionTime(0);
    setFeedback('');
    setShowExplanation(false);
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
    const questionText = currentQuestion.question;
    const parts = questionText.split('_____');
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

      <div className="space-y-4">
        <Button onClick={resetQuiz} className="w-full">
          Try Again
        </Button>
        <Button variant="outline" onClick={() => setShowExplanation(!showExplanation)} className="w-full">
          {showExplanation ? 'Hide' : 'Show'} Explanations
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            const stats = getAICacheStats();
            console.log('🤖 AI Cache Stats:', stats);
            alert(`AI Cache Stats:\n${stats.totalCachedQuestions} questions\n${stats.totalCachedWords} words cached`);
          }} 
          className="w-full"
        >
          <Brain className="h-4 w-4 mr-2" />
          AI Stats
        </Button>
      </div>

      {showExplanation && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Question Explanations</h3>
          {shuffledQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Badge variant={selectedAnswers[index] === question.correctAnswer ? "default" : "destructive"}>
                    {selectedAnswers[index] === question.correctAnswer ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium mb-2">Question {index + 1}: {question.question}</p>
                    <p className="text-sm text-gray-600">Your answer: {question.type === 'cloze' ? (clozeAnswers[index] && clozeAnswers[index].length > 0 ? clozeAnswers[index].join(', ') : 'Not answered') : (selectedAnswers[index] || 'Not answered')}</p>
                    <p className="text-sm text-gray-600">Correct answer: {question.correctAnswer}</p>
                    <p className="text-sm text-blue-600 mt-2">{question.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (!shuffledQuestions || shuffledQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-gray-500">Loading questions...</span>
      </div>
    );
  }

  if (showResults) {
    return (
      <Card className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-700">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent>
          {renderResults()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-blue-700">Dynamic Quiz</CardTitle>
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
      </CardHeader>

      <CardContent className="space-y-6">
        {currentQuestion.type === 'multiple-choice' ? renderMultipleChoiceQuestion() : renderClozeQuestion()}

        {feedback && (
          <Alert>
            <AlertDescription>{feedback}</AlertDescription>
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
          
          <Button
            onClick={handleNextQuestion}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : currentQuestionIndex === shuffledQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizGenerator; 