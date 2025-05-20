
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Operation = "addition" | "subtraction" | "multiplication" | "division";
type Difficulty = "easy" | "medium" | "hard";

interface Exercise {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}

const ExerciseGenerator = () => {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [operation, setOperation] = useState<Operation>("addition");
  const [score, setScore] = useState<number>(0);
  const [totalAttempted, setTotalAttempted] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  // Generate a new exercise based on difficulty and operation
  const generateExercise = () => {
    let num1, num2;

    // Set number ranges based on difficulty
    switch (difficulty) {
      case "easy":
        num1 = Math.floor(Math.random() * 10) + 1; // 1-10
        num2 = Math.floor(Math.random() * 10) + 1; // 1-10
        break;
      case "medium":
        num1 = Math.floor(Math.random() * 50) + 10; // 10-59
        num2 = Math.floor(Math.random() * 20) + 1; // 1-20
        break;
      case "hard":
        num1 = Math.floor(Math.random() * 100) + 50; // 50-149
        num2 = Math.floor(Math.random() * 50) + 10; // 10-59
        break;
      default:
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
    }

    // For division, ensure we get an integer result
    if (operation === "division") {
      // Find a number that divides num1 evenly
      const divisors = [];
      for (let i = 1; i <= num1; i++) {
        if (num1 % i === 0) {
          divisors.push(i);
        }
      }
      // Select a random divisor
      num2 = divisors[Math.floor(Math.random() * divisors.length)];
    }

    // For subtraction, ensure num1 > num2
    if (operation === "subtraction" && num2 > num1) {
      [num1, num2] = [num2, num1];
    }

    // Calculate the answer
    let answer;
    switch (operation) {
      case "addition":
        answer = num1 + num2;
        break;
      case "subtraction":
        answer = num1 - num2;
        break;
      case "multiplication":
        answer = num1 * num2;
        break;
      case "division":
        answer = num1 / num2;
        break;
      default:
        answer = 0;
    }

    setCurrentExercise({ num1, num2, operation, answer });
    setUserAnswer("");
  };

  // Check the user's answer
  const checkAnswer = () => {
    if (!currentExercise) return;
    
    const userNumAnswer = parseFloat(userAnswer);
    setTotalAttempted(prev => prev + 1);
    
    if (userNumAnswer === currentExercise.answer) {
      toast.success("Correct! Great job!");
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      generateExercise();
    } else {
      toast.error("Not quite right. Try again!");
      setStreak(0);
    }
  };

  // Handle key press to submit on Enter
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      checkAnswer();
    }
  };

  // Get the operation symbol
  const getOperationSymbol = (op: Operation) => {
    switch (op) {
      case "addition": return "+";
      case "subtraction": return "-";
      case "multiplication": return "×";
      case "division": return "÷";
      default: return "+";
    }
  };

  // Initialize with an exercise
  useEffect(() => {
    generateExercise();
  }, [difficulty, operation]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-edu-light-purple bg-opacity-20 border-b">
        <CardTitle className="text-2xl font-bold text-center">Math Exercise</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between mb-2">
            <div className="flex gap-2">
              {["addition", "subtraction", "multiplication", "division"].map((op) => (
                <Button
                  key={op}
                  variant={operation === op ? "default" : "outline"}
                  onClick={() => setOperation(op as Operation)}
                  className={`px-3 py-1 ${operation === op ? 'bg-edu-purple' : ''}`}
                >
                  {getOperationSymbol(op as Operation)}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {["easy", "medium", "hard"].map((diff) => (
                <Button
                  key={diff}
                  variant={difficulty === diff ? "default" : "outline"}
                  onClick={() => setDifficulty(diff as Difficulty)}
                  className={`px-3 py-1 ${difficulty === diff ? 'bg-edu-purple' : ''}`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="text-5xl font-bold mr-2">
                {currentExercise?.num1}
              </div>
              <div className="text-5xl font-bold mx-2">
                {getOperationSymbol(currentExercise?.operation || "addition")}
              </div>
              <div className="text-5xl font-bold ml-2">
                {currentExercise?.num2}
              </div>
            </div>
            <div className="mt-8">
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Your answer..."
                className="text-center text-xl max-w-xs mx-auto"
              />
            </div>
          </div>

          <Button 
            onClick={checkAnswer} 
            className="mt-4 bg-edu-blue hover:bg-blue-500"
            disabled={!userAnswer}
          >
            Check Answer
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm">
          Score: <span className="font-bold text-edu-purple">{score}</span> / {totalAttempted}
        </div>
        <div className="text-sm">
          Streak: <span className="font-bold text-edu-orange">{streak}</span>
        </div>
        <Button 
          variant="outline" 
          onClick={generateExercise}
          className="text-sm"
        >
          New Problem
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExerciseGenerator;
