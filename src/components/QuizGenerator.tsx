
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

type Subject = "math" | "science" | "english" | "history";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Sample quiz data
const quizData: Record<Subject, QuizQuestion[]> = {
  math: [
    {
      question: "What is the sum of angles in a triangle?",
      options: ["90°", "180°", "270°", "360°"],
      correctAnswer: 1,
      explanation: "The sum of angles in a triangle is always 180 degrees."
    },
    {
      question: "If 3x + 5 = 20, what is x?",
      options: ["3", "5", "7", "15"],
      correctAnswer: 1,
      explanation: "3x + 5 = 20, so 3x = 15, and x = 5."
    },
    {
      question: "What is the area of a rectangle with length 8 and width 6?",
      options: ["14", "24", "28", "48"],
      correctAnswer: 3,
      explanation: "Area of rectangle = length × width = 8 × 6 = 48 square units."
    },
    {
      question: "If a = 3 and b = 5, what is a² + b²?",
      options: ["8", "16", "34", "64"],
      correctAnswer: 2,
      explanation: "a² + b² = 3² + 5² = 9 + 25 = 34."
    },
    {
      question: "What is 20% of 80?",
      options: ["4", "8", "16", "20"],
      correctAnswer: 2,
      explanation: "20% of 80 = 0.2 × 80 = 16."
    }
  ],
  science: [
    {
      question: "What is the closest planet to the Sun?",
      options: ["Earth", "Mars", "Venus", "Mercury"],
      correctAnswer: 3,
      explanation: "Mercury is the closest planet to the Sun in our solar system."
    },
    {
      question: "Which of these is NOT a state of matter?",
      options: ["Solid", "Liquid", "Gas", "Element"],
      correctAnswer: 3,
      explanation: "The three common states of matter are solid, liquid, and gas. Element is a type of substance, not a state of matter."
    },
    {
      question: "What is photosynthesis?",
      options: [
        "How plants breathe",
        "How plants make food using sunlight",
        "How plants reproduce",
        "How plants grow"
      ],
      correctAnswer: 1,
      explanation: "Photosynthesis is the process by which plants use sunlight to convert carbon dioxide and water into food (glucose) and oxygen."
    },
    {
      question: "Which organ pumps blood through your body?",
      options: ["Brain", "Lungs", "Heart", "Stomach"],
      correctAnswer: 2,
      explanation: "The heart is responsible for pumping blood throughout the body."
    },
    {
      question: "What force pulls objects toward the center of Earth?",
      options: ["Magnetism", "Gravity", "Friction", "Electricity"],
      correctAnswer: 1,
      explanation: "Gravity is the force that pulls objects toward Earth's center."
    }
  ],
  english: [
    {
      question: "Which of these is a noun?",
      options: ["Run", "Happy", "House", "Quickly"],
      correctAnswer: 2,
      explanation: "A noun is a person, place, or thing. 'House' is a thing, so it's a noun."
    },
    {
      question: "What is the past tense of 'swim'?",
      options: ["Swimmed", "Swam", "Swimming", "Swum"],
      correctAnswer: 1,
      explanation: "The past tense of 'swim' is 'swam'. 'Swum' is the past participle."
    },
    {
      question: "What punctuation mark ends a question?",
      options: ["Period", "Question mark", "Exclamation mark", "Comma"],
      correctAnswer: 1,
      explanation: "Questions end with a question mark (?)."
    },
    {
      question: "Which word is an antonym for 'happy'?",
      options: ["Sad", "Joyful", "Excited", "Content"],
      correctAnswer: 0,
      explanation: "An antonym is a word that means the opposite. 'Sad' is the opposite of 'happy'."
    },
    {
      question: "What is a synonym for 'big'?",
      options: ["Small", "Tiny", "Large", "Short"],
      correctAnswer: 2,
      explanation: "A synonym is a word with a similar meaning. 'Large' means the same as 'big'."
    }
  ],
  history: [
    {
      question: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "John Adams"],
      correctAnswer: 2,
      explanation: "George Washington was the first President of the United States, serving from 1789 to 1797."
    },
    {
      question: "In which year did Christopher Columbus first reach the Americas?",
      options: ["1492", "1620", "1776", "1812"],
      correctAnswer: 0,
      explanation: "Christopher Columbus first reached the Americas in 1492."
    },
    {
      question: "What ancient civilization built the pyramids at Giza?",
      options: ["Romans", "Greeks", "Mayans", "Egyptians"],
      correctAnswer: 3,
      explanation: "The ancient Egyptians built the pyramids at Giza."
    },
    {
      question: "Which war was fought between the North and South in the United States?",
      options: ["World War I", "Revolutionary War", "Civil War", "War of 1812"],
      correctAnswer: 2,
      explanation: "The American Civil War was fought between the North (Union) and South (Confederacy)."
    },
    {
      question: "Who wrote the Declaration of Independence?",
      options: [
        "George Washington",
        "Thomas Jefferson",
        "Abraham Lincoln",
        "Benjamin Franklin"
      ],
      correctAnswer: 1,
      explanation: "Thomas Jefferson was the principal author of the Declaration of Independence."
    }
  ]
};

const QuizGenerator = () => {
  const [subject, setSubject] = useState<Subject>("math");
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);
  
  // Reset quiz when subject changes
  useEffect(() => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  }, [subject]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Prevent changing answer
    setSelectedAnswer(answerIndex);
    
    const correct = answerIndex === quizData[subject][currentQuestion].correctAnswer;
    
    if (correct) {
      toast.success("Correct answer!");
      setScore(prev => prev + 1);
    } else {
      toast.error("Not quite right.");
    }
    
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData[subject].length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
      toast.success(`Quiz completed! Your score: ${score + (selectedAnswer === quizData[subject][currentQuestion].correctAnswer ? 1 : 0)}/${quizData[subject].length}`);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  };

  const progress = ((currentQuestion + 1) / quizData[subject].length) * 100;

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-edu-light-purple bg-opacity-20 border-b">
        <CardTitle className="text-2xl font-bold text-center">Quiz Time</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {!quizComplete ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-center mb-4 space-x-2">
              {(["math", "science", "english", "history"] as Subject[]).map((s) => (
                <Button
                  key={s}
                  variant={subject === s ? "default" : "outline"}
                  onClick={() => setSubject(s)}
                  className={`px-4 py-1 ${subject === s ? 'bg-edu-purple' : ''}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>

            <div className="bg-gray-200 h-2 rounded-full mb-6">
              <div 
                className="h-2 bg-edu-purple rounded-full progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <h3 className="text-xl font-bold mb-4">
              Question {currentQuestion + 1} of {quizData[subject].length}
            </h3>
            
            <p className="text-lg mb-6">{quizData[subject][currentQuestion].question}</p>
            
            <div className="flex flex-col space-y-3">
              {quizData[subject][currentQuestion].options.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all quiz-option
                    ${selectedAnswer === null ? "hover:border-edu-purple" : ""}
                    ${selectedAnswer === index ? (
                      index === quizData[subject][currentQuestion].correctAnswer
                        ? "border-edu-green bg-edu-green bg-opacity-10"
                        : "border-edu-red bg-edu-red bg-opacity-10"
                    ) : selectedAnswer !== null && index === quizData[subject][currentQuestion].correctAnswer
                      ? "border-edu-green bg-edu-green bg-opacity-10"
                      : "border-gray-200"}
                  `}
                >
                  <div className="flex items-center">
                    <div className={`
                      w-6 h-6 rounded-full mr-3 flex items-center justify-center text-sm font-medium
                      ${selectedAnswer === index ? (
                        index === quizData[subject][currentQuestion].correctAnswer
                          ? "bg-edu-green text-white"
                          : "bg-edu-red text-white"
                      ) : selectedAnswer !== null && index === quizData[subject][currentQuestion].correctAnswer
                        ? "bg-edu-green text-white"
                        : "bg-gray-200 text-gray-700"}
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>{option}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {showExplanation && (
              <div className="mt-6 p-4 bg-edu-blue bg-opacity-10 border border-edu-blue rounded-lg">
                <h4 className="font-bold mb-2">Explanation:</h4>
                <p>{quizData[subject][currentQuestion].explanation}</p>
              </div>
            )}
            
            {selectedAnswer !== null && (
              <Button 
                onClick={handleNextQuestion}
                className="mt-4 bg-edu-blue hover:bg-blue-500"
              >
                {currentQuestion < quizData[subject].length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8">
            <h3 className="text-2xl font-bold">Quiz Complete!</h3>
            
            <div className="text-5xl font-bold text-edu-purple">
              {score}/{quizData[subject].length}
            </div>
            
            <p className="text-lg text-gray-700">
              {
                score === quizData[subject].length
                  ? "Perfect score! Amazing job! 🎉"
                  : score >= quizData[subject].length * 0.8
                  ? "Great job! You're doing excellent! 🌟"
                  : score >= quizData[subject].length * 0.6
                  ? "Good work! Keep practicing! 👍"
                  : "Keep learning! You'll improve next time! 📚"
              }
            </p>
            
            <div className="flex gap-4 mt-4">
              <Button
                onClick={restartQuiz}
                className="bg-edu-blue hover:bg-blue-500"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => setSubject((prev) => {
                  const subjects: Subject[] = ["math", "science", "english", "history"];
                  const currentIndex = subjects.indexOf(prev);
                  const nextIndex = (currentIndex + 1) % subjects.length;
                  return subjects[nextIndex];
                })}
              >
                Try Different Subject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizGenerator;
