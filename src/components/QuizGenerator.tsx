import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface QuizModuleProps {
  difficulty: "easy" | "medium" | "hard";
  onProgress: (score: number) => void;
}

const QuizGenerator = ({ difficulty, onProgress }: QuizModuleProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { toast } = useToast();

  const quizzes = {
    easy: [
      {
        question: "What is the plural of 'cat'?",
        options: ["cat", "cats", "cates", "caties"],
        correct: "cats",
        explanation: "Most nouns form the plural by adding 's'"
      },
      {
        question: "Which word is a verb?",
        options: ["book", "run", "blue", "happy"],
        correct: "run",
        explanation: "A verb is a word that shows action"
      },
      {
        question: "Choose the correct sentence:",
        options: [
          "I am go to school",
          "I am going to school", 
          "I going to school",
          "I goes to school"
        ],
        correct: "I am going to school",
        explanation: "Use 'am going' for present continuous tense"
      }
    ],
    medium: [
      {
        question: "Which sentence uses the past tense correctly?",
        options: [
          "Yesterday I walk to school",
          "Yesterday I walked to school",
          "Yesterday I walking to school", 
          "Yesterday I will walk to school"
        ],
        correct: "Yesterday I walked to school",
        explanation: "Past tense verbs often end in '-ed'"
      },
      {
        question: "What type of word is 'quickly'?",
        options: ["noun", "verb", "adjective", "adverb"],
        correct: "adverb",
        explanation: "Adverbs often end in '-ly' and describe how something is done"
      },
      {
        question: "Choose the sentence with correct punctuation:",
        options: [
          "What time is it",
          "What time is it.",
          "What time is it?",
          "What time is it!"
        ],
        correct: "What time is it?",
        explanation: "Questions end with a question mark (?)"
      }
    ],
    hard: [
      {
        question: "Identify the subject in: 'The big brown dog ran quickly.'",
        options: ["big", "brown", "dog", "ran"],
        correct: "dog",
        explanation: "The subject is who or what the sentence is about"
      },
      {
        question: "Which sentence uses a metaphor?",
        options: [
          "The sun is like a golden ball",
          "The sun is a golden ball",
          "The sun shines brightly",
          "The sun is very bright"
        ],
        correct: "The sun is a golden ball",
        explanation: "A metaphor directly compares two things without using 'like' or 'as'"
      },
      {
        question: "What is the correct form of the verb 'to be' for 'they'?",
        options: ["am", "is", "are", "be"],
        correct: "are",
        explanation: "Use 'are' with plural subjects like 'they'"
      }
    ]
  };

  const questions = quizzes[difficulty];

   const nextQuestion = useCallback(() => {
  setCurrentQuestion((prev) => prev + 1);
  setSelectedAnswer(null);
  setShowResult(false);
  setTimeLeft(30);
}, []);

const completeQuiz = useCallback(() => {
  setQuizCompleted(true);
  const finalScore = Math.round((score / questions.length) * 100);
  onProgress(finalScore);

  toast({
    title: "Quiz completed!",
    description: `You scored ${score}/${questions.length} (${finalScore}%)`,
  });
}, [score, questions.length, onProgress, toast]);

const handleTimeUp = useCallback(() => {
  setShowResult(true);
  setTimeout(() => {
    if (currentQuestion < questions.length - 1) {
      nextQuestion();
    } else {
      completeQuiz();
    }
  }, 2000);
}, [currentQuestion, questions.length, nextQuestion, completeQuiz]);

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
    
    if (answer === questions[currentQuestion].correct) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        nextQuestion();
      } else {
        completeQuiz();
      }
    }, 2000);
  };




  


  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setTimeLeft(30);
    setQuizCompleted(false);
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
                {score}/{questions.length}
              </div>
              <div className="text-lg text-gray-600">
                {Math.round((score / questions.length) * 100)}% Score
              </div>
            </div>
            
            <div className="space-y-2">
              {score === questions.length && (
                <Badge className="bg-yellow-500 text-white text-lg px-4 py-2">
                  Perfect Score! 🌟
                </Badge>
              )}
              {score >= questions.length * 0.8 && score < questions.length && (
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  Excellent Work! 👏
                </Badge>
              )}
              {score >= questions.length * 0.6 && score < questions.length * 0.8 && (
                <Badge className="bg-blue-500 text-white text-lg px-4 py-2">
                  Good Job! 👍
                </Badge>
              )}
              {score < questions.length * 0.6 && (
                <Badge className="bg-orange-500 text-white text-lg px-4 py-2">
                  Keep Practicing! 💪
                </Badge>
              )}
            </div>

            <Button onClick={restartQuiz} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {currentQuestion + 1}/{questions.length}
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
            <div className="text-sm text-gray-600">
              Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              {questions[currentQuestion].question}
            </h3>
            
            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    showResult
                      ? option === questions[currentQuestion].correct
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
                  {showResult && option === questions[currentQuestion].correct && (
                    <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {showResult && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Explanation:</strong> {questions[currentQuestion].explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizGenerator;