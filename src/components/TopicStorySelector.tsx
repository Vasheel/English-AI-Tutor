
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, Loader2, Flag } from 'lucide-react';
import { useAIStoryGeneration } from '@/hooks/useAIStoryGeneration';
import { mauritianStories } from '@/data/mauritianCulturalContent';

interface TopicStorySelectorProps {
  onStoryGenerated: (story: any) => void;
  difficulty: number;
}

const TopicStorySelector = ({ onStoryGenerated, difficulty }: TopicStorySelectorProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const { generateStory, isGenerating, error } = useAIStoryGeneration();

  const topics = [
    { id: 'animals', name: 'Animals & Nature', emoji: '🦁', description: 'Stories about wildlife and the natural world' },
    { id: 'adventure', name: 'Adventure', emoji: '🗺️', description: 'Exciting journeys and discoveries' },
    { id: 'science', name: 'Science & Discovery', emoji: '🔬', description: 'Learn through scientific adventures' },
    { id: 'friendship', name: 'Friendship', emoji: '🤝', description: 'Tales of friendship and kindness' },
    { id: 'space', name: 'Space & Stars', emoji: '🚀', description: 'Explore the cosmos and beyond' },
    { id: 'mystery', name: 'Mystery', emoji: '🔍', description: 'Solve puzzles and uncover secrets' },
    { id: 'mauritian-culture', name: 'Mauritian Culture', emoji: '🇲🇺', description: 'Stories about Mauritius culture and traditions', isCultural: true },
    { id: 'mauritian-history', name: 'Mauritian History', emoji: '🏛️', description: 'Learn about the history of Mauritius', isCultural: true },
    { id: 'mauritian-nature', name: 'Mauritian Nature', emoji: '🌺', description: 'Discover the natural beauty of Mauritius', isCultural: true }
  ];

  const handleTopicSelect = async (topicId: string) => {
    setSelectedTopic(topicId);
    
    // Check if it's a cultural topic
    const isCulturalTopic = topicId.startsWith('mauritian-');
    
    if (isCulturalTopic) {
      // Use pre-written Mauritian stories
      const culturalStories = mauritianStories.filter(story => 
        story.difficulty === difficulty && 
        (topicId === 'mauritian-culture' || 
         topicId === 'mauritian-history' || 
         topicId === 'mauritian-nature')
      );
      
      if (culturalStories.length > 0) {
        // Randomly select a story that matches the difficulty
        const randomStory = culturalStories[Math.floor(Math.random() * culturalStories.length)];
        onStoryGenerated(randomStory);
        return;
      }
    }
    
    // For non-cultural topics, use AI generation
    const story = await generateStory(topicId, difficulty);
    if (story) {
      onStoryGenerated(story);
    }
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
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
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          Choose Your Story Topic
        </CardTitle>
        <p className="text-gray-600">
          Select a topic and we'll generate a personalized story for your reading level!
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className={`cursor-pointer transition-all hover:scale-105 border-2 ${
                selectedTopic === topic.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : topic.isCultural 
                    ? 'border-green-300 hover:border-green-400 bg-green-50' 
                    : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => !isGenerating && handleTopicSelect(topic.id)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{topic.emoji}</div>
                <h3 className="font-semibold text-lg mb-1">{topic.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Level {difficulty}
                  </Badge>
                  {topic.isCultural && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      <Flag className="h-3 w-3 mr-1" />
                      Cultural
                    </Badge>
                  )}
                </div>
                {isGenerating && selectedTopic === topic.id && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">How it works:</h4>
              <p className="text-sm text-blue-700 mt-1">
                Choose a topic that interests you. We'll create a story just for you, 
                followed by comprehension questions and a fun fill-in-the-blanks exercise!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicStorySelector;
