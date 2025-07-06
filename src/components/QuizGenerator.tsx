// This version dynamically generates quiz questions from the PSAC vocabulary and grammar generator

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { psacVocabulary, generateGrammarQuestion, VocabWord, GrammarQuestion } from "./psacVocabulary.ts";


interface QuizModuleProps {
  difficulty: "easy" | "medium" | "hard";
  onProgress: (score: number, sessionTime?: number) => void;
}

interface QuizItem {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

const QuizGenerator = ({ difficulty, onProgress }: QuizModuleProps) => {
  const [quizList, setQuizList] = useState<QuizItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { toast } = useToast();
  
  // Use a ref to track the current score for accurate calculations
  const scoreRef = useRef(0);
  
  // Session timer to track actual time spent
  const { seconds: sessionTime, stop: stopSession, getFormattedTime } = useSessionTimer();

  const generateDynamicQuiz = useCallback(() => {
    const count = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
    const selected = [];
    const usedIndexes = new Set();

    while (selected.length < count && usedIndexes.size < psacVocabulary.length) {
      const idx = Math.floor(Math.random() * psacVocabulary.length);
      if (!usedIndexes.has(idx)) {
        usedIndexes.add(idx);
        const word = psacVocabulary[idx];
        const quiz = generateGrammarQuestion(word);

        if (quiz) {
          selected.push({
            question: quiz.question,
            options: quiz.options,
            correct: quiz.answer,
            explanation: `Related to: ${word.word}`
          });
        }
      }
    }
    setQuizList(selected);
  }, [difficulty]);

  useEffect(() => {
    generateDynamicQuiz();
  }, [generateDynamicQuiz]);

  const nextQuestion = useCallback(() => {
    setCurrentQuestion((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(30);
  }, []);

  const completeQuiz = useCallback(() => {
    setQuizCompleted(true);
    stopSession(); // Stop the session timer
    
    // Use the ref value for accurate calculation
    const currentScore = scoreRef.current;
    const finalScore = Math.round((currentScore / quizList.length) * 100);
    
    console.log(`🎯 QuizGenerator completeQuiz:`, {
      scoreState: score,
      scoreRef: currentScore,
      quizListLength: quizList.length,
      finalScore,
      sessionTime,
      calculation: `Math.round((${currentScore} / ${quizList.length}) * 100) = ${finalScore}`
    });
    
    onProgress(finalScore, sessionTime);

    toast({
      title: "Quiz completed!",
      description: `You scored ${currentScore}/${quizList.length} (${finalScore}%) in ${getFormattedTime()}`,
    });
  }, [score, quizList.length, onProgress, toast, sessionTime, stopSession, getFormattedTime]);

  const handleTimeUp = useCallback(() => {
    setShowResult(true);
    setTimeout(() => {
      if (currentQuestion < quizList.length - 1) {
        nextQuestion();
      } else {
        completeQuiz();
      }
    }, 2000);
  }, [currentQuestion, quizList.length, nextQuestion, completeQuiz]);

  useEffect(() => {
    if (timeLeft > 0 && !showResult && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp();
    }
  }, [timeLeft, showResult, quizCompleted, handleTimeUp]);

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === quizList[currentQuestion].correct;
    
    if (isCorrect) {
      setScore((prev) => {
        const newScore = prev + 1;
        scoreRef.current = newScore; // Update the ref
        console.log(`✅ Correct answer! Score updated: ${prev} → ${newScore}`);
        return newScore;
      });
    } else {
      console.log(`❌ Wrong answer. Score remains: ${scoreRef.current}`);
    }

    setTimeout(() => {
      if (currentQuestion < quizList.length - 1) {
        nextQuestion();
      } else {
        console.log(`🏁 Final score before completeQuiz: ${scoreRef.current}`);
        completeQuiz();
      }
    }, 2000);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    scoreRef.current = 0; // Reset the ref
    setShowResult(false);
    setTimeLeft(30);
    setQuizCompleted(false);
    generateDynamicQuiz();
    // Session timer will auto-restart when component re-renders
  };

  if (quizCompleted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Target className="h-6 w-6 text-green-500" />
              Quiz Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl">🎉</div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {score}/{quizList.length}
              </div>
              <div className="text-lg text-gray-600">
                {Math.round((score / quizList.length) * 100)}% Score
              </div>
            </div>
            <Button onClick={restartQuiz} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizList.length || !quizList[currentQuestion]) {
  return (
    <div className="text-center text-gray-600 p-4">
      Loading questions...
    </div>
  );
}

  const current = quizList[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-500" />
              English Quiz - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </CardTitle>
            <Badge variant="outline">
              {currentQuestion + 1}/{quizList.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className={`font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-600'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Session: {getFormattedTime()}</span>
              <span>Score: {score}/{currentQuestion + (showResult ? 1 : 0)}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              {current.question}
            </h3>

            <div className="space-y-3">
              {current.options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    showResult
                      ? option === current.correct
                        ? "default"
                        : selectedAnswer === option
                        ? "destructive"
                        : "outline"
                      : selectedAnswer === option
                      ? "secondary"
                      : "outline"
                  }
                  className="w-full text-left justify-start p-4 h-auto"
                  onClick={() => !showResult && handleAnswer(option)}
                  disabled={showResult}
                >
                  <span className="mr-3 font-bold">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                  {showResult && option === current.correct && (
                    <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {showResult && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Explanation:</strong> {current.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizGenerator;
