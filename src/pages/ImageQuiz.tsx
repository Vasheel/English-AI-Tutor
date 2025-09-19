import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useProgress } from '@/hooks/useProgress';
import { useSupabaseProgress } from '@/hooks/useSupabaseProgress';
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
  grammar_corrected?: string;  // Original grammar-only correction
  grammar_score: number;
  context_score: number;
  context_passed: boolean;
  score: number;
  explanations?: string[];
  context_feedback?: string[];
  confidence?: string;
}

// Request body for grammar evaluation
interface GrammarRequest {
  text: string;
  mode: string;
  dialect: string;
  grade_level: number;
  image_url?: string;
  image_id?: string | null;
}

// Flexible validation function that's more forgiving (kept as fallback)
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
    feedback = 'Excellent! Perfect description!';
  } else if (finalScore >= 80) {
    feedback = 'Great job! Your description captures the image well.';
  } else if (finalScore >= 60) {
    feedback = 'Good attempt! You got most of the key elements.';
    if (missedKeywords.length > 0) {
      suggestions.push(`Try mentioning: ${missedKeywords.join(', ')}`);
    }
  } else {
    feedback = 'Description needs improvement.';
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

// Function to convert relative paths to full URLs for the API
const getFullImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Convert relative path to full URL
  const baseUrl = window.location.origin;
  return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
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
  minWordCount = 10,
  onComplete
}: ImageQuizProps) {
  const [userDescription, setUserDescription] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [attempts, setAttempts] = useState(() => {
    // Load attempts from localStorage
    const savedAttempts = localStorage.getItem('imageQuiz_attempts');
    return savedAttempts ? parseInt(savedAttempts, 10) : 0;
  });
  const [bestScore, setBestScore] = useState(() => {
    // Load best score from localStorage
    const savedBestScore = localStorage.getItem('imageQuiz_bestScore');
    return savedBestScore ? parseInt(savedBestScore, 10) : 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [useVisionAPI, setUseVisionAPI] = useState(true); // Toggle for vision API

  // Progress tracking
  const { updateProgress, fetchProgress } = useProgress();
  const { updateProgress: updateSupabaseProgress, addSession } = useSupabaseProgress();
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Level + rotating images loaded from backend
  const [currentLevel, setCurrentLevel] = useState<'easy' | 'medium' | 'hard'>(() => {
    // Load last level from localStorage, fallback to difficulty prop
    const savedLevel = localStorage.getItem('imageQuiz_lastLevel') as 'easy' | 'medium' | 'hard';
    return savedLevel || difficulty;
  });
  const [images, setImages] = useState<PromptImage[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [reqKeywords, setReqKeywords] = useState<string[]>(correctKeywords);
  const [optKeywords, setOptKeywords] = useState<string[]>(optionalKeywords);

  const wordCount = userDescription.trim().split(/\s+/).filter(word => word.length > 0).length;
  const maxWords = 50;
  const progress = Math.min(100, (wordCount / minWordCount) * 100);
  const isOverLimit = wordCount > maxWords;

  // Save data to localStorage
  const saveToLocalStorage = (key: string, value: string | number) => {
    localStorage.setItem(key, value.toString());
  };

  // Update attempts and save to localStorage
  const updateAttempts = (newAttempts: number) => {
    setAttempts(newAttempts);
    saveToLocalStorage('imageQuiz_attempts', newAttempts);
  };

  // Update best score and save to localStorage
  const updateBestScore = (newBestScore: number) => {
    setBestScore(newBestScore);
    saveToLocalStorage('imageQuiz_bestScore', newBestScore);
  };

  // Update current level and save to localStorage
  const updateCurrentLevel = (newLevel: 'easy' | 'medium' | 'hard') => {
    setCurrentLevel(newLevel);
    saveToLocalStorage('imageQuiz_lastLevel', newLevel);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const submitStartTime = Date.now(); // Track submission start time
    
    try {
      // Get current image URL
      const shownPath = images[imgIndex]?.path || imageUrl;
      const currentImage = images.find(i => i.path === shownPath) || images[imgIndex];
      
      // Prepare request body
      const requestBody: GrammarRequest = {
        text: userDescription,
        mode: 'minimal',
        dialect: 'en-US',
        grade_level: 6
      };
  
      // Add image information based on vision API preference
      if (useVisionAPI) {
        // Convert to full URL for vision API
        requestBody.image_url = getFullImageUrl(shownPath);
      } else {
        // Use image_id for metadata-based validation
        requestBody.image_id = currentImage?.id || null;
      }
  
      const res = await fetch('/api/grammar/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
  
      if (!res.ok) throw new Error('Evaluation failed');
      
      const data = await res.json();
      const mapped: AIResult = {
        corrected: data.corrected,
        grammar_score: data.grammar_score ?? data.score ?? 0,
        context_score: data.context_score ?? 0,
        context_passed: data.context_passed ?? true,
        score: data.score ?? data.grammar_score ?? 0,
        explanations: data.explanations,
        context_feedback: data.context_feedback,
        confidence: data.confidence
      };
      
      setAiResult(mapped);
      setValidationResult(null);
      setAttempts(prev => prev + 1);
      
      if ((mapped.score ?? 0) > bestScore) {
        setBestScore(mapped.score ?? 0);
      }
      
      // Calculate time spent on this attempt
      const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
      const isCorrect = mapped.context_passed && (mapped.score ?? 0) >= 60;
      
      // Track progress in database
      try {
        const progressUpdate = {
          total_attempts: 1,
          correct_answers: isCorrect ? 1 : 0,
          total_time_spent: Math.max(1, timeSpentSeconds), // Minimum 1 second
          best_streak: isCorrect ? 1 : 0
        };
        
        console.log(`📈 Image Quiz Progress Update:`, progressUpdate);
        console.log(`⏱️ Time spent: ${timeSpentSeconds} seconds`);
        console.log(`✅ Correct: ${isCorrect} (Score: ${mapped.score}, Context passed: ${mapped.context_passed})`);
        
        await updateSupabaseProgress("image_quiz", progressUpdate);
        
        await addSession({
          user_id: '', // Will be filled by the hook
          activity_type: 'image_quiz',
          score: mapped.score || 0,
          total_questions: 1,
          time_spent: Math.max(1, timeSpentSeconds),
          difficulty_level: currentLevel === 'easy' ? 1 : currentLevel === 'medium' ? 2 : 3,
          session_data: {
            image_quiz_data: {
              score: mapped.score || 0,
              is_correct: isCorrect,
              difficulty: currentLevel,
              time_spent: timeSpentSeconds,
              use_vision_api: useVisionAPI
            }
          }
        });
        
        console.log(`✅ Image quiz progress updated successfully`);
      } catch (error) {
        console.error("Error updating image quiz progress:", error);
      }
      
      if (onComplete && isCorrect) {
        onComplete(mapped.score ?? 0);
      }
      
      // Reset timer for next attempt
      setStartTime(Date.now());
      
    } catch (e) {
      console.error('API evaluation failed:', e);
      
      // Calculate time spent for fallback as well
      const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
      
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
    
    if (result.score > bestScore) {
      setBestScore(result.score);
    }
      
      // Track progress even with fallback validation
      try {
        const progressUpdate = {
          total_attempts: 1,
          correct_answers: result.isCorrect ? 1 : 0,
          total_time_spent: Math.max(1, timeSpentSeconds),
          best_streak: result.isCorrect ? 1 : 0
        };
        
        console.log(`📈 Image Quiz Fallback Progress Update:`, progressUpdate);
        await updateSupabaseProgress("image_quiz", progressUpdate);
        
        await addSession({
          user_id: '', // Will be filled by the hook
          activity_type: 'image_quiz',
          score: result.score,
          total_questions: 1,
          time_spent: Math.max(1, timeSpentSeconds),
          difficulty_level: currentLevel === 'easy' ? 1 : currentLevel === 'medium' ? 2 : 3,
          session_data: {
            image_quiz_data: {
              score: result.score,
              is_correct: result.isCorrect,
              difficulty: currentLevel,
              time_spent: timeSpentSeconds,
              use_vision_api: false,
              validation_method: 'fallback'
            }
          }
        });
        
        console.log(`✅ Image quiz fallback progress updated`);
      } catch (error) {
        console.error("Error updating image quiz fallback progress:", error);
      }
    
    if (onComplete && result.isCorrect) {
      onComplete(result.score);
    }
    
      // Reset timer for next attempt
      setStartTime(Date.now());
      
    } finally {
    setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setUserDescription('');
    setValidationResult(null);
    setAiResult(null);
    setShowHints(false);
    setStartTime(Date.now());
  };

  const getDifficultyColor = () => {
    switch (currentLevel) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  // Initialize session timer when component mounts
  useEffect(() => {
    setSessionStartTime(Date.now());
    setStartTime(Date.now());
  }, []);

  // Reset timer when image changes
  useEffect(() => {
    setStartTime(Date.now());
  }, [imgIndex, currentLevel]);

  // Fetch images for the selected level
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/images/list?level=${currentLevel}`);
        if (!res.ok) throw new Error('Failed to load images');
        const data: PromptImage[] = await res.json();
        const imageList = Array.isArray(data) ? data : [];
        setImages(imageList);
        
        // Randomize initial image index
        if (imageList.length > 0) {
          const randomIndex = Math.floor(Math.random() * imageList.length);
          setImgIndex(randomIndex);
        } else {
          setImgIndex(0);
        }
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
    setStartTime(Date.now());
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

    if (img && !useVisionAPI) {
      // Only use metadata keywords if not using vision API
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
      // When using vision API, keep original keywords as fallback
      // Don't update keywords since vision API will handle validation directly
      if (reqKeywords.length === 0) {
        setReqKeywords(correctKeywords);
      }
      if (optKeywords.length === 0) {
        setOptKeywords(optionalKeywords || []);
      }
    }
  }, [images, imgIndex, useVisionAPI, correctKeywords, optionalKeywords, reqKeywords, optKeywords]);

  // Build a simple example description based on derived keywords
  const exampleDescription = (() => {
    if (useVisionAPI) {
      return 'Describe what you see in the image with details about the subject, action, and setting.';
    }
    
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
            {useVisionAPI && (
              <Badge className="bg-white/20 text-white border-white/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Vision
              </Badge>
            )}
          </CardTitle>
          <p className="text-white/90 mt-2">
            Write a sentence describing what you see in the image. You need to write at least 10 words before submitting your answer.
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

          {/* Level selector + Next image + Vision API toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {(['easy','medium','hard'] as const).map(lvl => (
              <Button
                key={lvl}
                size="sm"
                variant={currentLevel === lvl ? 'default' : 'outline'}
                className="capitalize"
                onClick={() => updateCurrentLevel(lvl)}
              >
                {lvl}
              </Button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={() => setUseVisionAPI(!useVisionAPI)}
                size="sm"
                variant={useVisionAPI ? 'default' : 'outline'}
                className="gap-2"
              >
                {useVisionAPI ? <Eye className="w-3 h-3" /> : <Brain className="w-3 h-3" />}
                {useVisionAPI ? 'AI Vision' : 'Keywords'}
              </Button>
              <Button onClick={nextImage} size="sm" variant="outline">
                Next Image →
              </Button>
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

          {/* Analysis Mode Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              {useVisionAPI ? (
                <>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700 font-medium">AI Vision Mode:</span>
                  <span className="text-gray-600">The AI will analyze the actual image to check your description</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">Keyword Mode:</span>
                  <span className="text-gray-600">Checking against predefined keywords: {reqKeywords.join(', ')}</span>
                </>
              )}
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
              <span className={`text-sm ${isOverLimit ? 'text-red-600' : wordCount >= minWordCount ? 'text-green-600' : 'text-gray-500'}`}>
                {wordCount}/{maxWords} words {wordCount >= minWordCount && `(min: ${minWordCount})`}
              </span>
            </label>
            
            <Textarea
              value={userDescription}
              onChange={(e) => {
                const newValue = e.target.value;
                const newWordCount = newValue.trim().split(/\s+/).filter(word => word.length > 0).length;
                if (newWordCount <= maxWords) {
                  setUserDescription(newValue);
                }
              }}
              placeholder="Describe what you see in the image. Be specific and detailed. Remember to write at least 10 words..."
              className={`min-h-[120px] resize-none ${isOverLimit ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            
            <Progress value={progress} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleSubmit}
              disabled={wordCount < minWordCount || isOverLimit || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {useVisionAPI ? 'Analyzing Image...' : 'Checking...'}
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

          {/* AI Results - Landscape Layout */}
          {aiResult && (
            <div className="space-y-6">
              {/* Landscape Layout: Image Left, Results Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Image */}
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
                
                {/* Right Side - Results */}
                <div className="space-y-4">
                  {/* Your Sentence vs Corrected */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-lg">Your sentence:</h4>
                      <p className="text-gray-700 text-lg">{userDescription}</p>
                    </div>
                    {aiResult.corrected && aiResult.corrected !== userDescription && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 text-lg">✏️ Corrected (Grammar + Context):</h4>
                        <p className="text-green-700 text-lg font-medium">{aiResult.corrected}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Scores Section */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-4xl font-bold text-blue-600">{aiResult.grammar_score}</div>
                  <div className="text-lg text-gray-600 font-medium">Grammar Score</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-4xl font-bold text-green-600">{aiResult.context_score}</div>
                  <div className="text-lg text-gray-600 font-medium">Context Score</div>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="text-4xl font-bold text-purple-600">{aiResult.score}</div>
                  <div className="text-lg text-gray-600 font-medium">Final Score</div>
                </div>
              </div>

              {/* Confidence Indicator */}
              {aiResult.confidence && (
                <div className="text-center">
                  <Badge 
                    className={`${
                      aiResult.confidence === 'high' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    {aiResult.confidence === 'high' ? '🎯 High Confidence' : '⚠️ Medium Confidence'}
                    {useVisionAPI ? ' (AI Vision)' : ' (Keywords)'}
                  </Badge>
                </div>
              )}
              
              {/* Detailed Context Feedback */}
              {aiResult.context_feedback && aiResult.context_feedback.length > 0 && (
                <Alert className={`${aiResult.context_score >= 80 ? 'bg-green-50 border-green-200' : aiResult.context_score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className={`w-6 h-6 mt-1 ${aiResult.context_score >= 80 ? 'text-green-600' : aiResult.context_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                    <div className='flex-1'>
                      <p className='font-semibold text-lg'>
                        {aiResult.context_score >= 80 ? 'Excellent description!' : 
                         aiResult.context_score >= 60 ? 'Good description, but could be better.' : 
                         'Description needs improvement.'}
                      </p>
                      <ul className='mt-3 list-disc list-inside text-base text-gray-700 space-y-1'>
                        {aiResult.context_feedback.map((feedback: string, i: number) => (
                          <li key={i}>{feedback}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Alert>
              )}
              
              {/* Additional explanations if any */}
              {aiResult.explanations && aiResult.explanations.length > 0 && (
                <Alert className='bg-blue-50 border-blue-200'>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className='w-6 h-6 text-blue-600 mt-1' />
                    <div className='flex-1'>
                      <p className='font-semibold text-lg'>Additional feedback:</p>
                      <ul className='mt-3 list-disc list-inside text-base text-gray-700 space-y-1'>
                        {aiResult.explanations.map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
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