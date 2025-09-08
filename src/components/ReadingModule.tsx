
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, RotateCcw } from "lucide-react";
import TopicStorySelector from "./TopicStorySelector";

interface ReadingModuleProps {
  level: number;
  onProgress: (points: number) => void;
}

const ReadingModule = ({ level, onProgress }: ReadingModuleProps) => {
  const [currentStory, setCurrentStory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStoryGenerated = (story: any) => {
    setCurrentStory(story);
    // reset reading state for a fresh session
  };

  const handleRestart = () => {
    setCurrentStory(null);
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
