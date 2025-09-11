
import { useState } from "react";
import { Loader, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { evaluateGrammar, type GrammarEvaluateResponse } from "@/lib/api";



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
}

const GrammarCorrector = () => {
  const [input, setInput] = useState("");
  const [corrected, setCorrected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [semanticWarnings, setSemanticWarnings] = useState<string[]>([]);


  const [grammarResult, setGrammarResult] = useState<GrammarResponse | null>(null);

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


    const handleCheck = (spokenText: string) => {
    setInput(spokenText);
    correctGrammar();
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
    setSemanticWarnings([]);

    try {
      const data: GrammarEvaluateResponse = await evaluateGrammar({ text: input });
      setGrammarResult(data as unknown as GrammarResponse);
      // Compute soft semantic warnings (e.g., pronoun–noun gender mismatch)
      try {
        const textForAnalysis = (data as any)?.corrected || input;
        setSemanticWarnings(getSemanticWarnings(textForAnalysis));
      } catch (_) {
        // ignore semantic analysis errors
      }
      setCorrected("");
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

  function getSemanticWarnings(text: string): string[] {
    const t = (text || "").toLowerCase();
    const warnings: string[] = [];

    const containsAny = (words: string[]) => words.some(w => new RegExp(`\\b${w}\\b`).test(t));

    const mascPronouns = ["he", "him", "his"]; // simple set
    const femPronouns = ["she", "her", "hers"]; // simple set

    const maleNouns = [
      "man","boy","father","brother","uncle","king","actor","waiter","policeman","businessman","gentleman","husband","son"
    ];
    const femaleNouns = [
      "woman","girl","mother","sister","aunt","queen","actress","waitress","policewoman","businesswoman","lady","wife","daughter"
    ];

    if (containsAny(femPronouns) && containsAny(maleNouns)) {
      warnings.push("Pronoun–noun mismatch: feminine pronoun with a male noun (meaning issue).");
    }
    if (containsAny(mascPronouns) && containsAny(femaleNouns)) {
      warnings.push("Pronoun–noun mismatch: masculine pronoun with a female noun (meaning issue).");
    }
    return warnings;
  }

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
        

      </div>

      <p className="text-sm text-gray-500 mb-4">
        Type a sentence and I'll help you make it perfect! Press Ctrl+Enter to check quickly.
      </p>





      <div className="flex items-start gap-2 mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="She don't has no pencil..."
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

          {semanticWarnings.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <strong className="text-orange-800">Semantic Note (not a grammar error):</strong>
              </div>
              <ul className="list-disc list-inside text-sm text-orange-900">
                {semanticWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}



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
              
                              <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-bold text-blue-600">{grammarResult.score}</div>
                  <div className="text-xs text-gray-600">Grammar</div>
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
          <button onClick={() => correctGrammar()} className="ml-auto text-red-700 hover:text-red-900">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GrammarCorrector;

