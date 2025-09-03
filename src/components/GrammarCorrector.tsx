
import { useState, useEffect } from "react";
import { Loader, RefreshCw, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";

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

interface GrammarResponse {
  corrected: string;
  diff: Array<{
    op: "equal" | "replace";
    token: string;
  }>;
  explanations: string[];
  score: number;
  tags: {
    SVA: number;
    Article: number;
    Spelling: number;
    Punctuation: number;
    Tense: number;
    WordChoice: number;
  };
  confidence: string;
  context_score: number;
  context_passed: boolean;
  grammar_score: number;
}

const GrammarCorrector = () => {
  const [input, setInput] = useState("");
  const [corrected, setCorrected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageMode, setImageMode] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<"easy" | "medium" | "hard">("easy");
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [grammarResult, setGrammarResult] = useState<GrammarResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [corrections, setCorrections] = useState<Array<{
    original: string;
    corrected: string;
    explanation: string;
    start: number;
    end: number;
  }>>([]);

  const { startListening, isListening } = useVoiceRecognition({
    onResult: (spokenText) => {
      setInput(spokenText);
      handleCheck(spokenText);
    },
    onError: (e) => console.error("Speech Error:", e),
  });

  // Load images when image mode is enabled
  useEffect(() => {
    if (imageMode) {
      loadImages();
    }
  }, [imageMode, selectedLevel]);

  const loadImages = async () => {
    try {
      const response = await fetch(`/api/images/list?level=${selectedLevel}`);
      if (response.ok) {
        const imageData = await response.json();
        setImages(imageData);
        if (imageData.length > 0) {
          setSelectedImage(imageData[0]);
          setCurrentImageIndex(0);
        }
      }
    } catch (error) {
      console.error("Failed to load images:", error);
      toast({
        title: "Error",
        description: "Failed to load images. Please try again.",
        variant: "destructive"
      });
    }
  };

  const goToNextImage = () => {
    if (images.length === 0) return;
    
    const nextIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
    
    // Clear previous results when changing images
    setGrammarResult(null);
    setCorrected("");
    setCorrections([]);
    resetRetryState(); // Reset retry state when moving to next image
  };

  const skipImage = () => {
    if (images.length === 0) return;
    
    // Skip to next image (same as next for now, but could be enhanced later)
    goToNextImage();
    
    toast({
      title: "Image skipped",
      description: "Moving to the next image. No penalty applied.",
    });
  };

  const handleRetry = () => {
    if (retryCount >= 2) {
      toast({
        title: "Maximum retries reached",
        description: "Let's move to the next image and try again!",
        variant: "destructive"
      });
      return;
    }
    
    setIsRetryMode(true);
    setRetryCount(prev => prev + 1);
    
    toast({
      title: "Retry mode activated",
      description: `Attempt ${retryCount + 2} of 3. Use the hint to improve your answer!`,
    });
  };

  const resetRetryState = () => {
    setRetryCount(0);
    setIsRetryMode(false);
  };

  const handleCheck = (spokenText: string) => {
    setInput(spokenText);
    if (imageMode && selectedImage) {
      evaluateGrammarWithImage(spokenText);
    } else {
      correctGrammar();
    }
  };

  const evaluateGrammarWithImage = async (text: string) => {
    if (!text.trim() || !selectedImage) {
      toast({
        title: "Please enter some text",
        description: "Type a sentence to check for grammar corrections.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError("");
    
    // Store previous result for comparison if in retry mode
    const previousResult = grammarResult;
    setGrammarResult(null);

    try {
      const response = await fetch("/api/grammar/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          image_id: selectedImage.id,
          mode: "minimal",
          dialect: "en-GB",
          grade_level: 6
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GrammarResponse = await response.json();
      setGrammarResult(result);
      setCorrected(result.corrected);
      
      // Handle retry success
      if (isRetryMode && result.context_passed && result.score > (previousResult?.score || 0)) {
        toast({
          title: "Nice fix! 🎉",
          description: `Great improvement! Your score went from ${previousResult?.score || 0} to ${result.score}`,
        });
        setIsRetryMode(false); // Exit retry mode on success
      } else if (isRetryMode) {
        // Show progress even if still failing
        const grammarProgress = previousResult ? result.grammar_score - previousResult.grammar_score : 0;
        const contextProgress = previousResult ? result.context_score - previousResult.context_score : 0;
        
        if (grammarProgress > 0 || contextProgress > 0) {
          toast({
            title: "Progress made! 📈",
            description: `Grammar: ${grammarProgress > 0 ? '+' : ''}${grammarProgress}, Context: ${contextProgress > 0 ? '+' : ''}${contextProgress}`,
          });
        }
      } else {
        toast({
          title: "Grammar evaluation complete!",
          description: `Score: ${result.score}/100`,
        });
      }
    } catch (err) {
      console.error("Grammar evaluation error:", err);
      setError("Failed to evaluate grammar. Please try again.");
      toast({
        title: "Error",
        description: "Failed to evaluate grammar. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const correctGrammar = async (retryCount = 0) => {
    if (!input.trim()) {
      toast({
        title: "Please enter some text",
        description: "Type a sentence to check for grammar corrections.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setCorrected("");
    setError("");
    setCorrections([]);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful grammar tutor for 6th grade students. Analyze the text and provide:
              1. The corrected version
              2. A list of specific corrections with explanations
              
              Format your response as JSON:
              {
                "corrected": "The corrected sentence here",
                "corrections": [
                  {
                    "original": "incorrect word/phrase",
                    "corrected": "correct word/phrase", 
                    "explanation": "Simple explanation why this was wrong"
                  }
                ],
                "encouragement": "A positive message for the student"
              }`
            },
            {
              role: "user",
              content: input,
            },
          ],
          temperature: 0.2,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        try {
          const result = JSON.parse(data.choices[0].message.content);
          setCorrected(result.corrected || data.choices[0].message.content);
          setCorrections(result.corrections || []);
          
          if (result.encouragement) {
            toast({
              title: "Great work!",
              description: result.encouragement,
            });
          }
        } catch {
          // Fallback to plain text if JSON parsing fails
          setCorrected(data.choices[0].message.content);
        }
      } else {
        throw new Error("Could not process response.");
      }
    } catch (err) {
      console.error("Grammar correction error:", err);
      
      if (retryCount < 2) {
        // Retry up to 2 times
        setTimeout(() => correctGrammar(retryCount + 1), 1000 * (retryCount + 1));
        toast({
          title: "Retrying...",
          description: `Attempt ${retryCount + 2} of 3`,
        });
        return;
      }
      
      setError("Oops! Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: "Failed to check grammar. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (imageMode && selectedImage) {
        evaluateGrammarWithImage(input);
      } else {
        correctGrammar();
      }
    }
  };

  const highlightText = (text: string) => {
    if (!corrections.length) return text;
    
    let highlightedText = text;
    corrections.forEach((correction, index) => {
      const regex = new RegExp(`\\b${correction.original}\\b`, 'gi');
      highlightedText = highlightedText.replace(
        regex, 
        `<mark class="bg-yellow-200 hover:bg-yellow-300 cursor-pointer relative" data-correction="${index}">${correction.original}</mark>`
      );
    });
    
    return highlightedText;
  };

  const renderDiff = (diff: GrammarResponse["diff"]) => {
    return (
      <div className="space-y-2">
        {diff.map((item, index) => (
          <span
            key={index}
            className={`inline-block px-2 py-1 rounded text-sm font-mono ${
              item.op === "replace"
                ? "bg-red-100 text-red-800 border border-red-300"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {item.token}
          </span>
        ))}
      </div>
    );
  };

  const renderTags = (tags: GrammarResponse["tags"]) => {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(tags).map(([key, value]) => (
          <span
            key={key}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              value > 0
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {key}: {value}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📝 Grammar Helper
          {loading && <Loader className="animate-spin h-4 w-4 text-purple-500" />}
        </h3>
        
        {/* Image Mode Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={imageMode}
              onChange={(e) => setImageMode(e.target.checked)}
              className="w-4 h-4 text-purple-600"
            />
            <span className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              Image Mode
            </span>
          </label>
          
          {imageMode && (
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as "easy" | "medium" | "hard")}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {imageMode 
          ? "Describe what you see in the image and I'll help you write it correctly!"
          : "Type a sentence and I'll help you make it perfect! Press Ctrl+Enter to check quickly."
        }
      </p>

             {/* Context Validation Warning */}
       {imageMode && grammarResult && !grammarResult.context_passed && (
         <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
           <div className="flex items-center gap-2">
             <span className="text-xl">⚠️</span>
             <div className="flex-1">
               <p className="text-sm font-medium text-orange-800">
                 Your sentence doesn't seem to match the image very well.
               </p>
               <p className="text-xs text-orange-700">
                 Try describing what you actually see in the picture, not something else.
               </p>
               
               {/* Retry Hint - show only one hint */}
               {isRetryMode && grammarResult.explanations.length > 0 && (
                 <div className="mt-2 p-2 bg-orange-200 border border-orange-400 rounded">
                   <p className="text-xs font-medium text-orange-800">💡 Hint:</p>
                   <p className="text-xs text-orange-700">{grammarResult.explanations[0]}</p>
                 </div>
               )}
               
               {/* Retry Counter */}
               <div className="mt-2 text-xs text-orange-600">
                 Attempts: {retryCount + 1}/3
               </div>
               
               {/* Max Retries Reached */}
               {retryCount >= 2 && (
                 <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                   <p className="text-xs font-medium text-red-800">Maximum retries reached</p>
                   <p className="text-xs text-red-700">Try the next image to continue learning!</p>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

      {/* Image Display */}
      {imageMode && selectedImage && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-4">
            <img
              src={selectedImage.path}
              alt={selectedImage.alt}
              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 mb-2">{selectedImage.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{selectedImage.alt}</p>
              
              {/* Enhanced metadata display */}
              <div className="space-y-2 mb-3">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-gray-500">Objects:</span>
                  {selectedImage.objects.map((obj, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {obj}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-gray-500">Actions:</span>
                  {selectedImage.actions.map((action, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {action}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-gray-500">Locations:</span>
                  {selectedImage.locations.map((location, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {location}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                Write a sentence describing what you see in this image. 
                Try to use descriptive language and proper grammar!
              </p>
              
              {/* Writing suggestions based on metadata */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-800 mb-2">💡 Writing Tips:</p>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• Try to include some of the objects: <span className="font-medium">{selectedImage.objects.slice(0, 3).join(", ")}</span></p>
                  <p>• Describe what's happening: <span className="font-medium">{selectedImage.actions.slice(0, 2).join(" and ")}</span></p>
                  <p>• Mention the location: <span className="font-medium">{selectedImage.locations[0]}</span></p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Image Navigation */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Image {currentImageIndex + 1} of {images.length}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                Level: {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={skipImage}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Skip this image (no penalty)"
              >
                ⏭️ Skip
              </button>
              <button
                onClick={goToNextImage}
                className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                title={currentImageIndex === images.length - 1 ? "Go to first image (wrapping around)" : "Go to next image"}
              >
                ➡️ Next
                {currentImageIndex === images.length - 1 && (
                  <span className="ml-1 text-xs opacity-70">↻</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={imageMode 
            ? "Describe what you see in the image..."
            : "She don't has no pencil..."
          }
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        />
        <button
          onClick={startListening}
          title="Speak your sentence"
          className={`p-3 rounded-lg text-white ${
            isListening ? "bg-red-600" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          🎤
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => imageMode && selectedImage ? evaluateGrammarWithImage(input) : correctGrammar()}
          className="bg-purple-400 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="animate-spin h-4 w-4" />
              {imageMode ? "Evaluating..." : "Checking..."}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              {imageMode ? "Evaluate My Writing" : "Check My Grammar"}
            </>
          )}
        </button>
        
        {/* Retry Button - only show when context fails or score is very low */}
        {imageMode && grammarResult && !grammarResult.context_passed && retryCount < 2 && (
          <button
            onClick={handleRetry}
            className="bg-orange-400 text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition-all duration-200 flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Retry ({3 - retryCount} left)
          </button>
        )}
      </div>

      {/* Grammar Results */}
      {grammarResult && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <strong className="text-green-800">Corrected Version:</strong>
            </div>
            <p className="text-green-900">{grammarResult.corrected}</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <strong className="text-blue-800">Changes Made:</strong>
            </div>
            {renderDiff(grammarResult.diff)}
          </div>

                     {/* Context Validation Results */}
           <div className={`p-4 border rounded-lg ${
             grammarResult.context_passed 
               ? "bg-green-50 border-green-300" 
               : "bg-orange-50 border-orange-300"
           }`}>
             <div className="flex items-center gap-2 mb-3">
               <span className="text-2xl">🎯</span>
               <strong className={grammarResult.context_passed ? "text-green-800" : "text-orange-800"}>
                 Context Validation: {grammarResult.context_passed ? "Passed" : "Needs Improvement"}
               </strong>
               {isRetryMode && (
                 <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                   Retry #{retryCount}
                 </span>
               )}
             </div>
             <div className="space-y-3">
               <div className="flex items-center gap-3">
                 <span className="text-2xl font-bold text-purple-600">
                   {grammarResult.context_score}/100
                 </span>
                 <span className="text-sm text-gray-600">
                   Context Score
                 </span>
               </div>
               
               {/* Show only one hint during retry mode */}
               {isRetryMode && grammarResult.explanations.length > 0 ? (
                 <div>
                   <p className="text-sm font-medium text-gray-700 mb-2">💡 Focus on this:</p>
                   <div className="bg-white p-2 rounded border-l-4 border-blue-400">
                     <p className="text-sm text-gray-700">{grammarResult.explanations[0]}</p>
                   </div>
                 </div>
               ) : grammarResult.explanations.length > 0 ? (
                 <div>
                   <p className="text-sm font-medium text-gray-700 mb-2">💡 Suggestions:</p>
                   <div className="space-y-2">
                     {grammarResult.explanations.map((hint, index) => (
                       <div key={index} className="bg-white p-2 rounded border-l-4 border-orange-400">
                         <p className="text-sm text-gray-700">{hint}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : null}
             </div>
           </div>

          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📊</span>
              <strong className="text-yellow-800">Final Score & Analysis:</strong>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-purple-600">
                  {grammarResult.score}/100
                </span>
                <span className="text-sm text-gray-600">
                  Final Score
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-blue-600">{grammarResult.grammar_score}</div>
                  <div className="text-xs text-gray-600">Grammar</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-green-600">{grammarResult.context_score}</div>
                  <div className="text-xs text-gray-600">Context</div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Error Categories:</p>
                {renderTags(grammarResult.tags)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Grammar Results */}
      {corrected && !grammarResult && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <strong className="text-green-800">Corrected Version:</strong>
            </div>
            <p className="text-green-900" dangerouslySetInnerHTML={{ __html: highlightText(corrected) }}></p>
          </div>

          {corrections.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <strong className="text-blue-800">What I Fixed:</strong>
              </div>
              <div className="space-y-2">
                {corrections.map((correction, index) => (
                  <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-400">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                        "{correction.original}"
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        "{correction.corrected}"
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{correction.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button
            onClick={() => imageMode && selectedImage ? evaluateGrammarWithImage(input) : correctGrammar()}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GrammarCorrector;

