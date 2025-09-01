import { useState } from 'react';
import { aiWordService, type WordData } from '@/services/aiWordService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const TestWordGeneration = () => {
  const [word, setWord] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGeneration = async (difficulty: 'easy' | 'medium' | 'hard') => {
    setLoading(true);
    setError(null);
    
    try {
      const words = await aiWordService.generateWords({ 
        difficulty, 
        count: 1 
      });
      
      if (words.length > 0) {
        setWord(words[0]);
        console.log('Generated word:', words[0]);
      } else {
        setError('No words generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrambleWord = (text: string): string => {
    const arr = text.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test Word Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => testGeneration('easy')}
            disabled={loading}
            variant="outline"
          >
            Generate Easy
          </Button>
          <Button 
            onClick={() => testGeneration('medium')}
            disabled={loading}
            variant="outline"
          >
            Generate Medium
          </Button>
          <Button 
            onClick={() => testGeneration('hard')}
            disabled={loading}
            variant="outline"
          >
            Generate Hard
          </Button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <p className="animate-pulse">Generating word...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded">
            Error: {error}
          </div>
        )}

        {word && !loading && (
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Scrambled:</p>
              <p className="text-2xl font-bold text-purple-800">
                {scrambleWord(word.word)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Answer:</p>
                <p className="font-bold">{word.word}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Difficulty:</p>
                <Badge variant="outline">{word.difficulty}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category:</p>
                <p>{word.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hint:</p>
                <p className="italic">{word.hint}</p>
              </div>
            </div>
            
            {word.definition && (
              <div>
                <p className="text-sm text-gray-600">Definition:</p>
                <p>{word.definition}</p>
              </div>
            )}
            
            {word.example && (
              <div>
                <p className="text-sm text-gray-600">Example:</p>
                <p className="italic">"{word.example}"</p>
              </div>
            )}

            {word.synonyms && word.synonyms.length > 0 && (
              <div>
                <p className="text-sm text-gray-600">Synonyms:</p>
                <div className="flex gap-2 flex-wrap">
                  {word.synonyms.map((syn: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{syn}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};