
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, XCircle, RotateCcw, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import TopicStorySelector from "./TopicStorySelector";
import ClozeTestComponent from "./ClozeTestComponent";

interface ReadingModuleProps {
  level: number;
  onProgress: (points: number) => void;
}

const ReadingModule = ({ level, onProgress }: ReadingModuleProps) => {
  const [currentStory, setCurrentStory] = useState<any>(null);
  const [showClozeTest, setShowClozeTest] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { updateProgress, addSession, getProgressByType } = useSupabaseProgress();

  const updateProgressData = async (sessionScore: number, sessionTotal: number) => {
    const currentProgress = getProgressByType('reading');
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 60000); // Convert to minutes
    const accuracy = sessionTotal > 0 ? (sessionScore / sessionTotal) * 100 : 0;
    
    // Update user progress
    await updateProgress('reading', {
      total_attempts: (currentProgress?.total_attempts || 0) + sessionTotal,
      correct_answers: (currentProgress?.correct_answers || 0) + sessionScore,
      total_time_spent: (currentProgress?.total_time_spent || 0) + Math.max(1, timeSpent),
      current_level: Math.floor(((currentProgress?.correct_answers || 0) + sessionScore) / 15) + 1,
      current_streak: accuracy >= 70 ? (currentProgress?.current_streak || 0) + 1 : 0,
      best_streak: accuracy >= 70 ? Math.max((currentProgress?.best_streak || 0), (currentProgress?.current_streak || 0) + 1) : (currentProgress?.best_streak || 0)
    });

    // Add session record
    await addSession({
      user_id: '', // Will be filled by the hook
      activity_type: 'reading',
      score: sessionScore,
      total_questions: sessionTotal,
      time_spent: Math.floor((Date.now() - sessionStartTime) / 1000), // In seconds
      difficulty_level: level,
      session_data: {
        story_topic: currentStory?.topic || 'general',
        accuracy: accuracy,
        story_title: currentStory?.title || 'Reading Practice'
      }
    });

    // Reset session timer and call progress callback
    setSessionStartTime(Date.now());
    onProgress(sessionScore);
  };

  const handleStoryGenerated = (story: any) => {
    setCurrentStory(story);
    setShowClozeTest(false);
    setScore(0);
    setTotalQuestions(0);
    setSessionStartTime(Date.now());
  };

  const handleStartClozeTest = () => {
    if (currentStory) {
      setShowClozeTest(true);
      setSessionStartTime(Date.now());
    }
  };

  const handleClozeTestComplete = async (finalScore: number, total: number) => {
    setScore(finalScore);
    setTotalQuestions(total);
    
    // Update progress in Supabase
    await updateProgressData(finalScore, total);
    
    const accuracy = (finalScore / total) * 100;
    
    toast({
      title: "Reading Session Complete! 📖",
      description: `You scored ${finalScore}/${total} (${Math.round(accuracy)}%)`,
    });
  };

  const handleRestart = () => {
    setCurrentStory(null);
    setShowClozeTest(false);
    setScore(0);
    setTotalQuestions(0);
    setSessionStartTime(Date.now());
  };

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
          {score > 0 && totalQuestions > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Session Complete!</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {score}/{totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.round((score / totalQuestions) * 100)}% Accuracy
                  </div>
                </div>
              </div>
              <Progress value={(score / totalQuestions) * 100} className="mt-2" />
            </div>
          )}

          {!currentStory && !showClozeTest && (
            <div className="space-y-4">
              <TopicStorySelector 
                onStoryGenerated={handleStoryGenerated}
                difficulty={level}
              />
            </div>
          )}

          {currentStory && !showClozeTest && (
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
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleStartClozeTest}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Start Comprehension Test
                </Button>
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

          {showClozeTest && currentStory && (
            <ClozeTestComponent 
              story={currentStory}
              onComplete={handleClozeTestComplete}
              onRestart={handleRestart}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReadingModule;
