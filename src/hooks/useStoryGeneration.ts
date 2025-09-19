import { useState, useCallback } from 'react';
import { storyGenerationService, Story, StoryGenerationOptions } from '@/services/storyGenerationService';

export const useStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStory = useCallback(async (options: StoryGenerationOptions): Promise<Story | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const story = await storyGenerationService.generateStory(options);
      setIsGenerating(false);
      return story;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate story';
      setError(errorMessage);
      setIsGenerating(false);
      return null;
    }
  }, []);

  const generateGeneralStory = useCallback(async (topic: string, difficulty: number): Promise<Story | null> => {
    return generateStory({
      topic,
      difficulty,
      isCultural: false
    });
  }, [generateStory]);

  const generateCulturalStory = useCallback(async (topic: string, difficulty: number, culturalContext: string = 'Mauritian'): Promise<Story | null> => {
    return generateStory({
      topic,
      difficulty,
      isCultural: true,
      culturalContext
    });
  }, [generateStory]);

  return {
    generateStory,
    generateGeneralStory,
    generateCulturalStory,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
};
