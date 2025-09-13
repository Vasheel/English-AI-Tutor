
import { useState, useCallback, useRef } from 'react';

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

// Define the SpeechRecognition interface for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;

  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

interface VoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export const useVoiceRecognition = ({
  onResult,
  onError,
  language = 'en-US'
}: VoiceRecognitionOptions) => {
  // ① detect API once, synchronously
  const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;
  const initialSupported = Boolean(SpeechRecognitionAPI);

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(initialSupported);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const initializeRecognition = useCallback(() => {
      if (!SpeechRecognitionAPI) return null;
    const recognition = new SpeechRecognitionAPI();


    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.trim();
      // Capitalize the first letter of the first word
      let capitalizedTranscript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
      
      // Add commas and periods for better grammar
      capitalizedTranscript = addPunctuation(capitalizedTranscript);
      
      onResult(capitalizedTranscript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      onError?.(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, [SpeechRecognitionAPI, language, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition();
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        onError?.('Failed to start voice recognition');
      }
    }
  }, [initializeRecognition, isListening, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
};
