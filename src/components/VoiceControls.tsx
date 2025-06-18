import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import fuzzysort from 'fuzzysort';
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";

// Define command patterns with fuzzy matching support
const commands = [
  { intent: "greet", keywords: ["hello", "hi", "hey", "good morning", "good afternoon"] },
  { intent: "time", keywords: ["what time", "current time", "time now"] },
  { intent: "games", keywords: ["games", "educational games", "continue learning"] },
  { intent: "reading", keywords: ["reading", "reading comprehension"] },
  { intent: "exercises", keywords: ["exercises", "practice", "practice exercises"] },
  { intent: "grammar", keywords: ["grammar", "grammar rules", "go to grammar"] },
  { intent: "quizzes", keywords: ["quizzes", "test", "take quiz"] },
  { intent: "progress", keywords: ["progress", "my progress", "check progress"] }
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

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suggestedCommands, setSuggestedCommands] = useState<string[]>([]);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
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
        default:
          setError("I didn't understand that. Please try again.");
          speak("I didn't understand that. Please try again.");
      }

      // Reset speech recognition after command is processed
      const rec = recognitionRef.current;
      if (rec) {
         rec.stop();                     // ⏹️ end current session
         setTranscript("");              // clear UI
         setTimeout(() => rec.start(), 300); // ▶️ fresh session
      }

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


  useEffect(() => {
  // bail out if browser doesn’t support it
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    setError('Speech API not supported');
    return;
  }

  // grab the constructor
  const API = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!API) {
  setError("Speech API not supported");
  return;
  }
  // API is now correctly typed as `SpeechRecognitionConstructor`
  const rec: SpeechRecognition = new API();
  recognitionRef.current = rec;

  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';

  rec.onresult = (event) => {
    const full = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');
    // final?
    if (event.results[event.results.length - 1].isFinal) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      isGrammarSection
        ? onSpeechInput(full)
        : handleSpeechInput(full);
    } else {
      setTranscript(full);
    }
  };

  rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
    console.error('SR error:', ev.error);
    setError(ev.error);
  };

  rec.onend = () => {
    // clear UI when engine stops
    setTranscript('');
    setIsListening(false);
  };

  // start listening
  rec.start();
  setIsListening(true);

  // cleanup on unmount
  return () => {
    rec.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };
}, [isGrammarSection, onSpeechInput, handleSpeechInput]);


  
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
        
        if (isGrammarSection) {
          onSpeechInput(currentTranscript);
        } else {
          handleSpeechInput(currentTranscript);
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
        <CardContent className="p-3">
          <p className="text-sm text-gray-700 mb-2">
            {transcript || "Listening for your command..."}
          </p>
          {error && (
            <p className="text-xs text-red-600 mb-2 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {suggestedCommands.map(cmd => (
              <button
                key={cmd}
                className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => handleSpeechInput(cmd)}
              >
                {cmd}
              </button>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Speak / Listening Toggle Button */}
      <SpeakButton
        isListening={isListening}
        onClick={() => {
          const rec = recognitionRef.current;
          if (!rec) return;
          if (isListening) {
            rec.stop();
            setIsListening(false);
          } else {
            rec.start();
            setIsListening(true);
          }
        }}
      />
    </div>
  </>
);

};

export default VoiceControls;
