import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Image {
  id: string;
  path: string;
  level: string;
  title: string;
  alt: string;
  objects: string[];
  actions: string[];
  locations: string[];
}

interface QuizResponse {
  corrected: string;
  context_passed: boolean;
  missing_objects: string[];
  feedback: string;
  grammar_score: number;
  context_score: number;
}

export default function ImageQuiz() {
  const [currentLevel, setCurrentLevel] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [currentImages, setCurrentImages] = useState<Image[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuizResponse | null>(null);

  useEffect(() => {
    loadImages();
  }, [currentLevel]);

  const loadImages = async () => {
    try {
      const response = await fetch(`/api/images/list?level=${currentLevel}`);
      if (!response.ok) throw new Error('Failed to load images');
      const images = await response.json();
      
      // Shuffle the images array
      const shuffledImages = [...images].sort(() => Math.random() - 0.5);
      
      setCurrentImages(shuffledImages);
      setCurrentImageIndex(0);
      setResult(null);
      setUserInput('');
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const handleLevelChange = (level: 'easy' | 'medium' | 'hard') => {
    setCurrentLevel(level);
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const currentImage = currentImages[currentImageIndex];
      const response = await fetch('/api/grammar/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userInput,
          image_id: currentImage.id,
          mode: 'minimal',
          dialect: 'en-US',
          grade_level: 6
        }),
      });

      if (!response.ok) throw new Error('Evaluation failed');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
    setResult(null);
    setUserInput('');
  };

  const currentImage = currentImages[currentImageIndex];

  if (!currentImage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading images...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🎨 Image Description Quiz</h1>
        <p className="text-gray-600 text-lg">Write a sentence describing what you see in the image</p>
      </div>

      {/* Level Selector */}
      <div className="flex justify-center gap-4">
        {(['easy', 'medium', 'hard'] as const).map((level) => (
          <Button
            key={level}
            variant={currentLevel === level ? "default" : "outline"}
            onClick={() => handleLevelChange(level)}
            className="capitalize px-8 py-3"
          >
            {level}
          </Button>
        ))}
      </div>

      {/* Image Container - Enlarged */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <img
              src={currentImage.path}
              alt={currentImage.alt}
              className="max-w-full h-auto max-h-[600px] rounded-lg shadow-lg mx-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your sentence here... For example: 'A young girl is feeding treats to a friendly dog.'"
              className="min-h-32 text-lg"
            />
            
            <div className="text-center">
              <Button
                onClick={handleSubmit}
                disabled={loading || !userInput.trim()}
                size="lg"
                className="px-8 py-3"
              >
                {loading ? '🤖 Analyzing...' : 'Check My Answer'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {result.context_passed && result.grammar_score >= 80 ? '🎉 Excellent!' : 
               result.context_passed ? '⚠️ Good description, but needs work' : '❌ Description needs improvement'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Original vs Corrected */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Your sentence:</h4>
                  <p className="text-gray-700">{userInput}</p>
                </div>
                
                {result.corrected && result.corrected !== userInput && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">✏️ Corrected:</h4>
                    <p className="text-green-700">{result.corrected}</p>
                  </div>
                )}
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.grammar_score}</div>
                  <div className="text-sm text-gray-600">Grammar Score</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.context_score}</div>
                  <div className="text-sm text-gray-600">Context Score</div>
                </div>
              </div>

              {/* Missing Objects */}
              {result.missing_objects && result.missing_objects.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">💡 Try mentioning these objects:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_objects.map((obj, index) => (
                      <span key={index} className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm">
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {result.feedback && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📝 Feedback:</h4>
                  <p className="text-blue-800">{result.feedback}</p>
                </div>
              )}

              {/* Next Button */}
              <div className="text-center">
                <Button onClick={nextImage} size="lg" className="px-8 py-3">
                  Next Image →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
