
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, RotateCcw, Flag, CheckCircle, XCircle } from "lucide-react";
import TopicStorySelector from "./TopicStorySelector";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ReadingModuleProps {
  level: number;
  onProgress: (points: number) => void;
}

const ReadingModule = ({ level, onProgress }: ReadingModuleProps) => {
  const { updateProgress, addSession } = useSupabaseProgress();
  const [currentStory, setCurrentStory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const trackSessionTime = async (storyTitle: string) => {
    if (sessionStartTime === 0) return;
    
    try {
      const timeSpentSeconds = Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000));
      
      // Track only time spent, no scores
      await updateProgress("reading_comprehension", {
        total_attempts: 1, // Track as 1 session attempt
        correct_answers: 0, // No scores tracked
        total_time_spent: timeSpentSeconds,
        current_streak: 0,
        best_streak: 0
      });

      await addSession({
        user_id: '', // Will be filled by the hook
        activity_type: 'reading_comprehension',
        score: 0, // No score tracking
        total_questions: 0, // No question tracking
        time_spent: timeSpentSeconds,
        difficulty_level: level,
        session_data: {
          reading_comprehension_data: {
            story_title: storyTitle,
            time_spent: timeSpentSeconds,
            level: level
          }
        }
      });

      console.log('✅ Reading Comprehension time tracked:', { storyTitle, timeSpentSeconds, level });
    } catch (error) {
      console.error('❌ Failed to track Reading Comprehension time:', error);
    }
  };

  const handleStoryGenerated = (story: any) => {
    setCurrentStory(story);
    setSessionStartTime(Date.now()); // Start timer when story is generated
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setScore(0);
    // reset reading state for a fresh session
  };

  const handleRestart = async () => {
    // Track time before restarting
    if (currentStory) {
      await trackSessionTime(currentStory.title || 'Unknown Story');
    }
    setCurrentStory(null);
    setSessionStartTime(0);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setScore(0);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (currentStory?.culturalQuestions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      const totalQuestions = currentStory?.culturalQuestions?.length || 0;
      const correctAnswers = userAnswers.filter((answer, index) => 
        answer === currentStory?.culturalQuestions?.[index]?.correct_answer
      ).length;
      const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      setScore(finalScore);
      setShowResults(true);
      onProgress(finalScore);
    }
  };

  const isCulturalStory = currentStory?.culturalQuestions && currentStory.culturalQuestions.length > 0;

  // Track time when component unmounts or story changes
  useEffect(() => {
    return () => {
      if (currentStory && sessionStartTime > 0) {
        trackSessionTime(currentStory.title || 'Unknown Story');
      }
    };
  }, [currentStory, sessionStartTime]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-500" />
            Reading Adventures - Level {level}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!currentStory && (
            <div className="space-y-4">
              <TopicStorySelector 
                onStoryGenerated={handleStoryGenerated}
                difficulty={level}
              />
            </div>
          )}

          {currentStory && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-blue-800">
                  {currentStory.title}
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  {currentStory.content.split('\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Cultural Questions Section */}
              {isCulturalStory && !showResults && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Flag className="h-5 w-5" />
                      🇲🇺 Cultural Comprehension Questions
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(currentQuestionIndex + 1) / currentStory.culturalQuestions.length * 100} 
                        className="flex-1"
                      />
                      <span className="text-sm text-green-700">
                        Question {currentQuestionIndex + 1} of {currentStory.culturalQuestions.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        {currentStory.culturalQuestions[currentQuestionIndex].question}
                      </h4>
                      
                      {currentStory.culturalQuestions[currentQuestionIndex].type === 'multiple_choice' ? (
                        <RadioGroup
                          value={userAnswers[currentQuestionIndex] || ''}
                          onValueChange={handleAnswerSelect}
                        >
                          {currentStory.culturalQuestions[currentQuestionIndex].options?.map((option: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`option-${index}`} />
                              <Label htmlFor={`option-${index}`} className="text-sm">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <Input
                          placeholder="Type your answer here..."
                          value={userAnswers[currentQuestionIndex] || ''}
                          onChange={(e) => handleAnswerSelect(e.target.value)}
                          className="w-full"
                        />
                      )}
                    </div>
                    
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
                        disabled={!userAnswers[currentQuestionIndex]}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {currentQuestionIndex === currentStory.culturalQuestions.length - 1 ? 'Finish' : 'Next'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results Section */}
              {showResults && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <CheckCircle className="h-5 w-5" />
                      Quiz Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {score}%
                      </div>
                      <p className="text-blue-700">
                        You scored {score}% on the cultural comprehension questions!
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {currentStory.culturalQuestions.map((question: any, index: number) => (
                        <div key={question.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                          <div className="flex-shrink-0 mt-1">
                            {userAnswers[index] === question.correct_answer ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 mb-1">
                              {question.question}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Your answer:</strong> {userAnswers[index] || 'No answer'}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Correct answer:</strong> {question.correct_answer}
                            </p>
                            <p className="text-sm text-blue-600">
                              <strong>Explanation:</strong> {question.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRestart}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Story
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReadingModule;
