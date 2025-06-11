
import { useState } from "react";
import { Loader, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const GrammarCorrector = () => {
  const [input, setInput] = useState("");
  const [corrected, setCorrected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [corrections, setCorrections] = useState<Array<{
    original: string;
    corrected: string;
    explanation: string;
    start: number;
    end: number;
  }>>([]);

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
      correctGrammar();
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

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl mx-auto mt-6">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        📝 Grammar Helper
        {loading && <Loader className="animate-spin h-4 w-4 text-purple-500" />}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Type a sentence and I'll help you make it perfect! Press Ctrl+Enter to check quickly.
      </p>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="She don't has no pencil..."
        className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4 resize-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
      />
      
      <button
        onClick={() => correctGrammar()}
        className="bg-purple-400 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader className="animate-spin h-4 w-4" />
            Checking...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Check My Grammar
          </>
        )}
      </button>

      {corrected && (
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
            onClick={() => correctGrammar()}
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
