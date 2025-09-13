import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useControlledSpeechRecognition } from '@/hooks/useControlledSpeechRecognition';
import { useNavigate } from 'react-router-dom';
import fuzzysort from 'fuzzysort';
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";

// Function to add punctuation to speech input
const addPunctuation = (text: string): string => {
  if (!text.trim()) return text;
  
  let result = text.trim();
  
  // Add comma before common conjunctions
  const conjunctions = [' and ', ' but ', ' or ', ' so ', ' yet ', ' for ', ' nor '];
  conjunctions.forEach(conjunction => {
    const regex = new RegExp(conjunction, 'gi');
    result = result.replace(regex, `,${conjunction}`);
  });
  
  // Add comma after introductory words/phrases
  const introWords = ['well ', 'oh ', 'yes ', 'no ', 'okay ', 'sure ', 'actually ', 'however ', 'therefore ', 'meanwhile ', 'first ', 'second ', 'finally '];
  introWords.forEach(word => {
    const regex = new RegExp(`^${word}`, 'i');
    if (regex.test(result)) {
      result = result.replace(regex, `${word.charAt(0).toUpperCase() + word.slice(1)}, `);
    }
  });
  
  // Add comma before relative clauses (who, which, that)
  result = result.replace(/\s+(who|which|that)\s+/gi, ', $1 ');
  
  // Add comma in lists (before "and" in lists of 3+ items)
  result = result.replace(/(\w+)\s+and\s+(\w+)\s+and\s+/gi, '$1, $2, and ');
  
  // Add comma after time expressions
  result = result.replace(/(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm))\s+/gi, '$1, ');
  
  // Add comma after addresses and locations
  result = result.replace(/(\d+\s+\w+\s+street|\d+\s+\w+\s+avenue|\d+\s+\w+\s+road)\s+/gi, '$1, ');
  
  // Add period at the end if no punctuation exists
  if (!/[.!?]$/.test(result)) {
    result += '.';
  }
  
  // Clean up multiple commas
  result = result.replace(/,\s*,/g, ',');
  
  // Clean up spaces around punctuation
  result = result.replace(/\s+([,.!?])/g, '$1');
  result = result.replace(/([,.!?])\s*([,.!?])/g, '$1$2');
  
  return result;
};

// Define command patterns with fuzzy matching support
const commands = [
  { intent: "greet", keywords: ["hello", "hi", "hey", "good morning", "good afternoon"] },
  { intent: "time", keywords: ["what time", "current time", "time now"] },
  { intent: "games", keywords: ["games", "educational games", "continue learning"] },
  { intent: "reading", keywords: ["reading", "reading comprehension"] },
  { intent: "exercises", keywords: ["exercises", "practice", "practice exercises"] },
  { intent: "grammar", keywords: ["grammar", "grammar rules", "go to grammar"] },
  { intent: "quizzes", keywords: ["quizzes", "test", "take quiz"] },
  { intent: "progress", keywords: ["progress", "my progress", "check progress"] },
  { intent: "cloze", keywords: ["close test", "cloze test", "cloze", "close"] },
  { intent: "chat", keywords: ["psac chat", "chat", "ai chat", "tutor chat", "psac"] },
  { intent: "image-quiz", keywords: ["image quiz", "picture quiz", "image", "picture"] },
  { intent: "smart-quiz", keywords: ["smart quiz", "adaptive quiz", "smart", "adaptive"] },
  { intent: "topic-questions", keywords: ["topic questions", "ai demo", "topic", "questions"] }
];

// Get best matching command using fuzzy search
const getIntentFromSpeech = (transcript: string): { intent: string | null; confidence: number } => {
  const lowerTranscript = transcript.toLowerCase();
  let bestMatch = { intent: null, confidence: 0 };

  commands.forEach(command => {
    const matches = fuzzysort.go(lowerTranscript, command.keywords);
    if (matches.length > 0) {
      const topMatch = matches[0];
      if (topMatch.score > bestMatch.confidence) {
        bestMatch = { intent: command.intent, confidence: topMatch.score };
      }
    }
  });

  return bestMatch;
};

interface SpeechRecognitionType extends globalThis.SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechSynthesisUtterance {
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
  text: string;
}

interface VoiceControlsProps {
  onSpeechInput: (text: string) => void;
  isGrammarSection?: boolean;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({ onSpeechInput, isGrammarSection = false }) => {
  const navigate = useNavigate();
  const isSpeechApiSupported = ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) as boolean;
  const isTtsApiSupported = 'SpeechSynthesisUtterance' in window;

  // Listening state handled by controlled SR hook
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suggestedCommands, setSuggestedCommands] = useState<string[]>([]);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Initialize suggested commands
  useEffect(() => {
    const defaultCommands = [
      "hello", "what time", "games", "reading", 
      "exercises", "grammar", "quizzes", "progress",
      "close test", "psac chat", "image quiz", "smart quiz", "topic questions"
    ];
    setSuggestedCommands(defaultCommands);
  }, []);
  const recognitionRef = useRef<SpeechRecognition|null>(null);

  const synth = window.speechSynthesis;

  // Speak function
  const speak = useCallback((text: string) => {
    if (!isTtsApiSupported) {
      console.error('Text-to-Speech API not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    synth.speak(utterance);
  }, [isTtsApiSupported, synth]);

  // Handle speech input with fuzzy matching
  const handleSpeechInput = useCallback((text: string) => {
    // Clear transcript immediately to prevent accumulation
    setTranscript('');
    
    const result = getIntentFromSpeech(text);
    
    if (result.confidence < -2000) { // Adjust threshold as needed
      setError("I didn't understand that. Please try again.");
      speak("Hmm, I’m not quite sure what you meant — could you repeat that?");
      return;
    }
    setError(null);

    speak(`Understood.`);

    
    // Add to recent commands
    setRecentCommands(prev => [...prev, result.intent || 'unknown']);
    
    // Process the command
    try {
      const lowerCommand = text.toLowerCase();
      
      // Navigation commands
      switch (result.intent) {
        case 'greet':
          speak('Hello! How can I assist you today?');
          break;
        case 'time': {
          const now = new Date();
          speak(`The current time is ${now.toLocaleTimeString()}`);
          break;
        }
        case 'games':
          speak('Opening the educational games section for you!');
          navigate('/games');
          break;
        case 'reading':
          speak('Opening the reading comprehension section for you!');
          navigate('/reading');
          break;
        case 'exercises':
          speak('Opening the exercises section for you!');
          navigate('/exercises');
          break;
        case 'grammar':
          speak('Opening the grammar section for you!');
          navigate('/grammar');
          break;
        case 'quizzes':
          speak('Opening the quizzes section for you!');
          navigate('/quizzes');
          break;
        case 'progress':
          speak('Opening your progress section for you!');
          navigate('/progress');
          break;
        case 'cloze':
          speak('Opening the close test section for you!');
          navigate('/cloze');
          break;
        case 'chat':
          speak('Opening the PSAC chat for you!');
          navigate('/chat');
          break;
        case 'image-quiz':
          speak('Opening the image quiz for you!');
          navigate('/image-quiz');
          break;
        case 'smart-quiz':
          speak('Opening the smart quiz for you!');
          navigate('/adaptive-quiz');
          break;
        case 'topic-questions':
          speak('Opening the topic questions for you!');
          navigate('/ai-demo');
          break;
        default:
          setError("I didn't understand that. Please try again.");
          speak("I didn't understand that. Please try again.");
      }

      // Do not auto-restart; manual control only

    } catch (error) {
      console.error('Error processing speech input:', error);
      setError('Error processing your command');
    }
 }, [navigate, speak]);


    // Suggested commands carousel
  useEffect(() => {
    const suggested = commands.map(cmd => cmd.keywords[0]);
    setSuggestedCommands(suggested);
  }, []);


  const { isSupported, isListening: controlledListening, startListening, stopListening, toggleListening } = useControlledSpeechRecognition({
    onResult: (text) => (isGrammarSection ? onSpeechInput(text) : handleSpeechInput(text)),
    onError: (err) => setError(err),
    language: 'en-US',
    timeout: 8000
  });


  
 // Initialize speech recognition
  const recognition = useMemo(() => {
    if (!isSpeechApiSupported) return null;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const instance = new SpeechRecognition();
    
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = 'en-US';

    instance.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      // Only process final results
      if (event.results[event.results.length - 1].isFinal) {
        // Clear transcript before processing
        setTranscript('');
        
        // Capitalize the first letter of the first word and add punctuation
        let capitalizedTranscript = currentTranscript.charAt(0).toUpperCase() + currentTranscript.slice(1);
        capitalizedTranscript = addPunctuation(capitalizedTranscript);
        
        if (isGrammarSection) {
          onSpeechInput(capitalizedTranscript);
        } else {
          handleSpeechInput(capitalizedTranscript);
        }
      } else {
        // Update interim transcript
        setTranscript(currentTranscript);
      }
    };

    instance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
    };

    instance.onend = () => {
      // Reset transcript when recognition ends
      setTranscript('');
    };

    return instance;
  }, [isSpeechApiSupported, onSpeechInput, isGrammarSection, handleSpeechInput]);

  


  // Handle suggested command click
  const handleSuggestedCommandClick = useCallback((command: string) => {
    handleSpeechInput(command);
    speak(`I heard: ${command}`);
  }, [handleSpeechInput, speak]);

const SpeakButton: React.FC<{ isListening: boolean; onClick: () => void }> = ({
  isListening,
  onClick,
}) => (
  <button
    onClick={onClick}
    aria-label={isListening ? "Stop Listening" : "Start Listening"}
    className={`
      relative w-12 h-12 rounded-full flex items-center justify-center text-white
      bg-red-500 hover:bg-red-600 transition-colors duration-200
      ${isListening ? "bg-red-700" : ""}
    `}
  >
    {isListening && (
      <span className="absolute inset-0 rounded-full ring-2 ring-red-400 animate-ping" />
    )}

    {isListening ? (
      <Loader2 className="relative w-6 h-6 animate-spin" />
    ) : (
      <svg
        className="relative w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    )}
  </button>
);


return (
  <>
    <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-2 z-50">
      {/* Transcript / Error / Suggestions Card */}
      <div className="w-64 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <h3 className="text-xs font-medium text-gray-600">Voice Commands</h3>
        </div>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${controlledListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <p className="text-sm text-gray-700">
              {controlledListening ? "Listening..." : "Ready to listen"}
            </p>
          </div>
          {transcript && (
            <p className="text-sm text-blue-600 mb-2 bg-blue-50 p-2 rounded">
              "{transcript}"
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 mb-2 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1">Try saying:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedCommands.map(cmd => (
                <button
                  key={cmd}
                  className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => handleSuggestedCommandClick(cmd)}
                  title={`Click to say: ${cmd}`}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Speak / Listening Toggle Button */}
      <SpeakButton
        isListening={controlledListening}
        onClick={toggleListening}
      />
    </div>
  </>
);

};

export default VoiceControls;
