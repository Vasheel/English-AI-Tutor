
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Star } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useToast } from '@/hooks/use-toast';

interface ClozeTestProps {
  text: string;
  answers: string[];
  onComplete: (score: number) => void;
  onRestart: () => void;
}

const ClozeTestComponent = ({ text, answers, onComplete, onRestart }: ClozeTestProps) => {
  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(answers.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const { playSound } = useSoundEffects();
  const { toast } = useToast();

  // Split the text by blanks (______) to create segments
  const textSegments = text.split('______');

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value.trim();
    setUserAnswers(newAnswers);
  };

  const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
    return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  };

  const handleSubmit = () => {
    let correctCount = 0;
    userAnswers.forEach((answer, index) => {
      if (checkAnswer(answer, answers[index])) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    if (correctCount === answers.length) {
      playSound('success');
      toast({
        title: "Perfect Score! 🌟",
        description: "You got all the answers correct!",
      });
    } else if (correctCount >= answers.length * 0.7) {
      playSound('correct');
      toast({
        title: "Great Job! 👍",
        description: `You got ${correctCount} out of ${answers.length} correct!`,
      });
    } else {
      playSound('incorrect');
      toast({
        title: "Keep Practicing! 📚",
        description: `You got ${correctCount} out of ${answers.length} correct. Try again!`,
      });
    }

    onComplete(correctCount);
  };

  const handleRestart = () => {
    setUserAnswers(new Array(answers.length).fill(''));
    setSubmitted(false);
    setScore(0);
    onRestart();
  };

  const isComplete = userAnswers.every(answer => answer.trim() !== '');

  if (submitted) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Cloze Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {score}/{answers.length}
            </div>
            <div className="text-lg text-gray-600">
              Correct Answers
            </div>
            <div className="mt-2">
              {score === answers.length && (
                <Badge className="bg-yellow-500 text-white">
                  Perfect Score! 🌟
                </Badge>
              )}
              {score >= answers.length * 0.7 && score < answers.length && (
                <Badge className="bg-green-500 text-white">
                  Great Job! 👍
                </Badge>
              )}
              {score < answers.length * 0.7 && (
                <Badge className="bg-orange-500 text-white">
                  Keep Practicing! 📚
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Review Your Answers:</h4>
            {answers.map((correctAnswer, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded border">
                <span className="font-medium">Blank {index + 1}:</span>
                <span className="text-gray-600">Your answer: "{userAnswers[index]}"</span>
                {checkAnswer(userAnswers[index], correctAnswer) ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-green-600">Correct: "{correctAnswer}"</span>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button onClick={handleRestart} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              New Story
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          Fill in the Blanks
        </CardTitle>
        <p className="text-gray-600">
          Read the passage and fill in the missing words. Think about what makes sense in context!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-lg leading-relaxed">
            {textSegments.map((segment, index) => (
              <span key={index}>
                {segment}
                {index < answers.length && (
                  <Input
                    className="inline-block w-24 mx-1 text-center border-b-2 border-blue-400 bg-white"
                    value={userAnswers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="?"
                    disabled={submitted}
                  />
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Progress: {userAnswers.filter(a => a.trim() !== '').length}/{answers.length} blanks filled
          </div>
          <Badge variant={isComplete ? "default" : "secondary"}>
            {isComplete ? "Ready to Submit!" : "Keep Going..."}
          </Badge>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!isComplete}
          className="w-full"
          size="lg"
        >
          Submit Answers
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClozeTestComponent;
