
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, RotateCcw, Flag, CheckCircle, XCircle, Sparkles, Globe, Loader2 } from "lucide-react";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import { useStoryGeneration } from "@/hooks/useStoryGeneration";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Story } from "@/services/storyGenerationService";

interface ReadingModuleProps {
  level: number;
  onProgress: (points: number) => void;
}

const ReadingModule = ({ level, onProgress }: ReadingModuleProps) => {
  const { updateProgress, addSession } = useSupabaseProgress();
  const { generateGeneralStory, generateCulturalStory, isGenerating, error } = useStoryGeneration();
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedSection, setSelectedSection] = useState<'general' | 'cultural' | null>(null);

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

  const handleGenerateGeneralStory = async (topic: string) => {
    const story = await generateGeneralStory(topic, level);
    if (story) {
      setCurrentStory(story);
      setSessionStartTime(Date.now());
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setShowResults(false);
      setScore(0);
      setSelectedSection('general');
    }
  };

  const handleGenerateCulturalStory = async (topic: string) => {
    const story = await generateCulturalStory(topic, level, 'Mauritian');
    if (story) {
      setCurrentStory(story);
      setSessionStartTime(Date.now());
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setShowResults(false);
      setScore(0);
      setSelectedSection('cultural');
    }
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
    setSelectedSection(null);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (currentStory?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      const totalQuestions = currentStory?.questions?.length || 0;
      const correctAnswers = userAnswers.filter((answer, index) => 
        answer === currentStory?.questions?.[index]?.options?.[currentStory?.questions?.[index]?.correctAnswer]
      ).length;
      const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      setScore(finalScore);
      setShowResults(true);
      onProgress(finalScore);
    }
  };

  // Track time when component unmounts or story changes
  useEffect(() => {
    return () => {
      if (currentStory && sessionStartTime > 0) {
        trackSessionTime(currentStory.title || 'Unknown Story');
      }
    };
  }, [currentStory, sessionStartTime]);

  // Helper functions for emojis
  const getTopicEmoji = (topic: string): string => {
    const emojiMap: { [key: string]: string } = {
      'Animals & Nature': '🦁',
      'Adventure': '🗺️',
      'Science': '🔬',
      'Friendship': '🤝',
      'Space': '🚀',
      'Mystery': '🔍'
    };
    return emojiMap[topic] || '📚';
  };

  const getCulturalTopicEmoji = (topic: string): string => {
    const emojiMap: { [key: string]: string } = {
      'Culture & Traditions': '🎭',
      'History': '🏛️',
      'Nature & Wildlife': '🌺',
      'Food & Cuisine': '🍛',
      'Festivals': '🎉',
      'Local Life': '🏘️'
    };
    return emojiMap[topic] || '🇲🇺';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-500" />
            AI-Powered Reading Adventures - Level {level}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!currentStory && (
            <div className="space-y-6">
              {/* Section Selection */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Choose your reading adventure:
                </h3>
                <p className="text-sm text-gray-600">
                  Each story is uniquely generated by AI just for you!
                </p>
              </div>

              {/* General Stories Section */}
              <Card className="border-blue-200 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Globe className="h-5 w-5" />
                    General Stories
                    <Badge variant="secondary" className="ml-auto">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Explore diverse topics with AI-generated stories tailored to your level
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Animals & Nature', 'Adventure', 'Science', 'Friendship', 'Space', 'Mystery'].map((topic) => (
                      <Button
                        key={topic}
                        variant="outline"
                        onClick={() => handleGenerateGeneralStory(topic)}
                        disabled={isGenerating}
                        className="h-auto p-3 flex flex-col items-center gap-2"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="text-lg">{getTopicEmoji(topic)}</span>
                        )}
                        <span className="text-xs text-center">{topic}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cultural Stories Section */}
              <Card className="border-green-200 hover:border-green-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Flag className="h-5 w-5" />
                    🇲🇺 Mauritian Cultural Stories
                    <Badge variant="secondary" className="ml-auto">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Discover Mauritius through AI-generated stories about culture, traditions, and history
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Culture & Traditions', 'History', 'Nature & Wildlife', 'Food & Cuisine', 'Festivals', 'Local Life'].map((topic) => (
                      <Button
                        key={topic}
                        variant="outline"
                        onClick={() => handleGenerateCulturalStory(topic)}
                        disabled={isGenerating}
                        className="h-auto p-3 flex flex-col items-center gap-2 border-green-300 hover:border-green-400"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="text-lg">{getCulturalTopicEmoji(topic)}</span>
                        )}
                        <span className="text-xs text-center">{topic}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-red-500 text-lg mb-2">⚠️</div>
                    <p className="text-red-600">{error}</p>
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline" 
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentStory && (
            <div className="space-y-4">
              {/* Story Display */}
              <div className={`border rounded-lg p-6 ${selectedSection === 'cultural' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {currentStory.title}
                  </h3>
                  {currentStory.isCultural && (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <Flag className="h-3 w-3 mr-1" />
                      Cultural
                    </Badge>
                  )}
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  {currentStory.content.split('\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Questions Section */}
              {!showResults && currentStory.questions && currentStory.questions.length > 0 && (
                <Card className={`${selectedSection === 'cultural' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${selectedSection === 'cultural' ? 'text-green-800' : 'text-blue-800'}`}>
                      <CheckCircle className="h-5 w-5" />
                      Comprehension Questions
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(currentQuestionIndex + 1) / currentStory.questions.length * 100} 
                        className="flex-1"
                      />
                      <span className={`text-sm ${selectedSection === 'cultural' ? 'text-green-700' : 'text-blue-700'}`}>
                        Question {currentQuestionIndex + 1} of {currentStory.questions.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        {currentStory.questions[currentQuestionIndex].question}
                      </h4>
                      
                      <RadioGroup
                        value={userAnswers[currentQuestionIndex] || ''}
                        onValueChange={handleAnswerSelect}
                      >
                        {currentStory.questions[currentQuestionIndex].options.map((option: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="text-sm">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
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
                        className={selectedSection === 'cultural' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                      >
                        {currentQuestionIndex === currentStory.questions.length - 1 ? 'Finish' : 'Next'}
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
                        You scored {score}% on the comprehension questions!
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {currentStory.questions.map((question: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                          <div className="flex-shrink-0 mt-1">
                            {userAnswers[index] === question.options[question.correctAnswer] ? (
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
                              <strong>Correct answer:</strong> {question.options[question.correctAnswer]}
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
