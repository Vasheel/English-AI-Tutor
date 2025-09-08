import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Image, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Lightbulb,
  Send,
  Trophy,
  Target,
  Eye,
  Brain,
  Sparkles
} from 'lucide-react';

// Types
interface ImageQuizProps {
  imageUrl: string;
  correctKeywords: string[];
  optionalKeywords?: string[];
  contextHints?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  minWordCount?: number;
  onComplete?: (score: number) => void;
}

// Server image type
type PromptImage = {
  id: string;
  path: string;
  level: 'easy' | 'medium' | 'hard';
  title?: string;
  alt?: string;
  objects?: string[];
  actions?: string[];
  locations?: string[];
};

interface ValidationResult {
  score: number;
  feedback: string;
  matchedKeywords: string[];
  missedKeywords: string[];
  suggestions: string[];
  isCorrect: boolean;
}

// AI evaluation result
interface AIResult {
  corrected: string;
  grammar_score: number;
  context_score: number;
  context_passed: boolean;
  score: number;
  explanations?: string[];
}

// Flexible validation function that's more forgiving
const validateImageDescription = (
  userDescription: string,
  correctKeywords: string[],
  optionalKeywords: string[] = [],
  minWordCount: number = 10
): ValidationResult => {
  const description = userDescription.toLowerCase().trim();
  const words = description.split(/\s+/);
  
  // Check word count
  if (words.length < minWordCount) {
    return {
      score: 0,
      feedback: `Your description is too short. Please write at least ${minWordCount} words.`,
      matchedKeywords: [],
      missedKeywords: correctKeywords,
      suggestions: [`Try to describe what you see in more detail.`],
      isCorrect: false
    };
  }

  // Check for required keywords (with synonyms)
  const keywordSynonyms: Record<string, string[]> = {
    'bird': ['bird', 'seagull', 'gull', 'seabird', 'flying creature', 'avian'],
    'flying': ['flying', 'flight', 'soaring', 'gliding', 'airborne', 'wings spread'],
    'sky': ['sky', 'air', 'clouds', 'blue sky', 'heavens', 'atmosphere'],
    'seagull': ['seagull', 'gull', 'sea bird', 'white bird', 'coastal bird'],
    'wings': ['wings', 'wing', 'feathers', 'wingspan'],
    'white': ['white', 'pale', 'light-colored', 'bright'],
    'blue': ['blue', 'azure', 'clear', 'bright'],
    'clouds': ['clouds', 'cloud', 'cloudy', 'cumulus'],
  };

  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];
  let baseScore = 0;

  // Check required keywords
  correctKeywords.forEach(keyword => {
    const synonyms = keywordSynonyms[keyword] || [keyword];
    const found = synonyms.some(syn => description.includes(syn));
    
    if (found) {
      matchedKeywords.push(keyword);
      baseScore += (100 / correctKeywords.length);
    } else {
      missedKeywords.push(keyword);
    }
  });

  // Bonus points for optional keywords
  let bonusPoints = 0;
  optionalKeywords.forEach(keyword => {
    const synonyms = keywordSynonyms[keyword] || [keyword];
    if (synonyms.some(syn => description.includes(syn))) {
      bonusPoints += 5;
      matchedKeywords.push(`${keyword} (bonus)`);
    }
  });

  // Calculate final score
  const finalScore = Math.min(100, Math.round(baseScore + bonusPoints));
  
  // Generate feedback
  let feedback = '';
  const suggestions: string[] = [];
  
  if (finalScore === 100) {
    feedback = '🎉 Excellent! Perfect description!';
  } else if (finalScore >= 80) {
    feedback = '👍 Great job! Your description captures the image well.';
  } else if (finalScore >= 60) {
    feedback = '✅ Good attempt! You got most of the key elements.';
    if (missedKeywords.length > 0) {
      suggestions.push(`Try mentioning: ${missedKeywords.join(', ')}`);
    }
  } else {
    feedback = '📝 Description needs improvement.';
    suggestions.push(`Include these key elements: ${missedKeywords.join(', ')}`);
    suggestions.push('Be more specific about what you see in the image.');
  }

  return {
    score: finalScore,
    feedback,
    matchedKeywords,
    missedKeywords,
    suggestions,
    isCorrect: finalScore >= 60
  };
};

// Main Component
export default function ImageDescriptionQuiz({
  imageUrl = '/images/prompts/medium/img_1.png',
  correctKeywords = ['bird', 'flying', 'sky'],
  optionalKeywords = ['clouds', 'wings', 'blue'],
  contextHints = [
    'Describe what you see in the image',
    'Mention the main subject',
    'Include details about the environment'
  ],
  difficulty = 'medium',
  minWordCount = 3,
  onComplete
}: ImageQuizProps) {
  const [userDescription, setUserDescription] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  // Level + rotating images loaded from backend
  const [currentLevel, setCurrentLevel] = useState<'easy' | 'medium' | 'hard'>(difficulty);
  const [images, setImages] = useState<PromptImage[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [reqKeywords, setReqKeywords] = useState<string[]>(correctKeywords);
  const [optKeywords, setOptKeywords] = useState<string[]>(optionalKeywords);

  const wordCount = userDescription.trim().split(/\s+/).filter(word => word.length > 0).length;
  const progress = Math.min(100, (wordCount / minWordCount) * 100);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Ensure we pass the ID that matches the image actually shown
      const shownPath = images[imgIndex]?.path || imageUrl;
      const currentImage = images.find(i => i.path === shownPath) || images[imgIndex];
      const res = await fetch('/api/grammar/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userDescription,
          image_id: currentImage?.id || null,
          mode: 'minimal',
          dialect: 'en-US',
          grade_level: 6
        })
      });
      if (!res.ok) throw new Error('Evaluation failed');
      const data = await res.json();
      const mapped: AIResult = {
        corrected: data.corrected,
        grammar_score: data.grammar_score ?? data.score ?? 0,
        context_score: data.context_score ?? 0,
        context_passed: data.context_passed ?? true,
        score: data.score ?? data.grammar_score ?? 0,
        explanations: data.explanations
      };
      setAiResult(mapped);
      setValidationResult(null);
      setAttempts(prev => prev + 1);
      if ((mapped.score ?? 0) > bestScore) setBestScore(mapped.score ?? 0);
      if (onComplete && (mapped.context_passed || (mapped.grammar_score ?? 0) >= 60)) onComplete(mapped.score ?? 0);
    } catch (e) {
      // Fallback to local validator
      const result = validateImageDescription(
        userDescription,
        reqKeywords,
        optKeywords,
        minWordCount
      );
      setAiResult(null);
      setValidationResult(result);
      setAttempts(prev => prev + 1);
      if (result.score > bestScore) setBestScore(result.score);
      if (onComplete && result.isCorrect) onComplete(result.score);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setUserDescription('');
    setValidationResult(null);
    setAiResult(null);
    setShowHints(false);
  };

  const getDifficultyColor = () => {
    switch (currentLevel) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  // Fetch images for the selected level
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/images/list?level=${currentLevel}`);
        if (!res.ok) throw new Error('Failed to load images');
        const data: PromptImage[] = await res.json();
        setImages(Array.isArray(data) ? data : []);
        setImgIndex(0);
      } catch (e) {
        console.error('Image list fetch failed:', e);
        setImages([]);
        setImgIndex(0);
      }
    };
    fetchImages();
  }, [currentLevel]);

  // Choose the displayed image url (backend first, else prop fallback)
  const displayedUrl = images[imgIndex]?.path || imageUrl;

  const nextImage = () => {
    setImgIndex((prev) => images.length ? (prev + 1) % images.length : 0);
    setValidationResult(null);
    setUserDescription('');
    setAiResult(null);
  };

  // Derive dynamic keywords from current image metadata/title/alt
  useEffect(() => {
    const img = images[imgIndex];
    const tokensFromText = (text?: string) =>
      (text || '')
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3);

    if (img) {
      const objects = img.objects || [];
      const actions = img.actions || [];
      const locations = img.locations || [];
      const titleTokens = tokensFromText(img.title);
      const altTokens = tokensFromText(img.alt);

      const bag = Array.from(new Set([
        ...objects,
        ...actions,
        ...locations,
        ...titleTokens,
        ...altTokens
      ]));

      // Prioritize objects -> actions -> locations
      const required = [
        ...(objects.slice(0, 2)),
        ...(actions.slice(0, 2)),
        ...(locations.slice(0, 1))
      ].filter(Boolean);

      // Optional: add a few more descriptive tokens
      const optional = bag.filter(t => !required.includes(t)).slice(0, 6);

      // Fallbacks for common scenes
      const withFallbackReq = required.length ? required : (bag.slice(0, 3));

      // Only update when values actually change to avoid extra renders
      const sameA = JSON.stringify(withFallbackReq) === JSON.stringify(reqKeywords);
      const sameB = JSON.stringify(optional) === JSON.stringify(optKeywords);
      if (!sameA) setReqKeywords(withFallbackReq);
      if (!sameB) setOptKeywords(optional);
    } else {
      // No backend image yet – keep props
      // Do not re-derive from default arrays each render; leave initial state
    }
  }, [images, imgIndex, reqKeywords, optKeywords]);

  // Build a simple example sentence based on derived keywords
  const exampleDescription = (() => {
    const [obj1, obj2] = reqKeywords;
    const act = reqKeywords.find(k => /ing$/.test(k)) || optKeywords.find(k => /ing$/.test(k));
    const loc = optKeywords.find(k => ['beach','park','garden','classroom','kitchen','forest','street','room','library'].includes(k));
    if (obj1 && act && loc) return `A ${obj1} is ${act} in the ${loc}.`;
    if (obj1 && act) return `A ${obj1} is ${act}.`;
    if (obj1 && obj2) return `A ${obj1} with ${obj2} is shown.`;
    return 'Describe what you see in the image with the subject, action, and place.';
  })();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Image className="w-8 h-8" />
            Image Description Quiz
          </CardTitle>
          <p className="text-white/90 mt-2">
            Write a sentence describing what you see in the image.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Difficulty and Stats */}
          <div className="flex justify-between items-center">
            <Badge className={`${getDifficultyColor()} text-white px-3 py-1`}>
              {currentLevel.toUpperCase()}
            </Badge>
            <div className="flex gap-4 text-sm">
              <span>Attempts: {attempts}</span>
              <span>Best Score: {bestScore}%</span>
            </div>
          </div>

          {/* Level selector + Next image */}
          <div className="flex flex-wrap items-center gap-3">
            {(['easy','medium','hard'] as const).map(lvl => (
              <Button
                key={lvl}
                size="sm"
                variant={currentLevel === lvl ? 'default' : 'outline'}
                className="capitalize"
                onClick={() => setCurrentLevel(lvl)}
              >
                {lvl}
              </Button>
            ))}
            <div className="ml-auto">
              <Button onClick={nextImage} size="sm" variant="outline">Next Image →</Button>
            </div>
          </div>

          {/* Image Display */}
          <div className="relative rounded-lg overflow-hidden border-4 border-gray-200 shadow-lg">
            <img 
              src={displayedUrl} 
              alt="Describe this image"
              className="w-full h-auto object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge className="bg-black/50 text-white">
                <Eye className="w-3 h-3 mr-1" />
                Observe Carefully
              </Badge>
            </div>
          </div>

          {/* Hints Section */}
          {contextHints && (
            <div className="bg-blue-50 rounded-lg p-4">
              <Button
                onClick={() => setShowHints(!showHints)}
                variant="ghost"
                size="sm"
                className="mb-2"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {showHints ? 'Hide Hints' : 'Show Hints'}
              </Button>
              
              {showHints && (
                <ul className="space-y-1 text-sm text-blue-700">
                  {contextHints.map((hint, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      {hint}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Your Description:</span>
              <span className={`text-sm ${wordCount >= minWordCount ? 'text-green-600' : 'text-gray-500'}`}>
                {wordCount}/{minWordCount} words
              </span>
            </label>
            
            <Textarea
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              placeholder="Describe what you see in the image. Be specific and detailed..."
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />
            
            <Progress value={progress} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleSubmit}
              disabled={wordCount < minWordCount || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Check My Answer
                </>
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          {/* AI Results */}
          {aiResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Your sentence:</h4>
                  <p className="text-gray-700">{userDescription}</p>
                </div>
                {aiResult.corrected && aiResult.corrected !== userDescription && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">✏️ Corrected:</h4>
                    <p className="text-green-700">{aiResult.corrected}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{aiResult.grammar_score}</div>
                  <div className="text-sm text-gray-600">Grammar Score</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{aiResult.context_score}</div>
                  <div className="text-sm text-gray-600">Context Score</div>
                </div>
              </div>
              {!aiResult.context_passed && (
                <Alert className='bg-yellow-50 border-yellow-200'>
                  <div className='flex items-start gap-2'>
                    <AlertCircle className='w-5 h-5 text-yellow-600 mt-0.5' />
                    <div className='flex-1'>
                      <p className='font-semibold'>Description needs improvement.</p>
                      {aiResult.explanations && aiResult.explanations.length > 0 && (
                        <ul className='mt-2 list-disc list-inside text-sm text-gray-700'>
                          {aiResult.explanations.map((h: string, i: number) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          )}

          {/* Validation Results (fallback) */}
          {validationResult && (
            <div className="space-y-4 animate-in slide-in-from-bottom">
              {/* Score Display */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                  <div>
                    <div className="text-3xl font-bold">{validationResult.score}</div>
                    <div className="text-xs">SCORE</div>
                  </div>
                </div>
              </div>

              {/* Feedback Alert */}
              <Alert className={validationResult.isCorrect ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
                <div className="flex items-start gap-2">
                  {validationResult.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{validationResult.feedback}</p>
                    
                    {validationResult.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {validationResult.suggestions.map((suggestion, index) => (
                          <p key={index} className="text-sm text-gray-600">
                            💡 {suggestion}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>

              {/* Keywords Analysis */}
              <div className="grid md:grid-cols-2 gap-4">
                {validationResult.matchedKeywords.length > 0 && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Elements You Mentioned
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.matchedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="bg-green-100 text-green-700">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {validationResult.missedKeywords.length > 0 && (
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Missing Elements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.missedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="bg-red-100 text-red-700">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Example Answer */}
              {!validationResult.isCorrect && (
                <Card className="bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Example Answer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 italic">{exampleDescription}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}