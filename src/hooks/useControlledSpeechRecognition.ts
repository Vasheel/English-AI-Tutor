import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
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

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
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

interface ControlledSpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
  timeout?: number;
  commands?: { [key: string]: () => void };
}

export const useControlledSpeechRecognition = ({
  onResult,
  onError,
  language = 'en-US',
  timeout = 10000,
  commands = {}
}: ControlledSpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setIsSupported(true);
      const recognition: SpeechRecognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, timeout);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript.trim();
        const matchedCommand = Object.keys(commands).find((cmd) =>
          transcript.toLowerCase().includes(cmd.toLowerCase())
        );
        if (matchedCommand) {
          commands[matchedCommand]!();
        } else {
          onResult(transcript);
        }
        stopListening();
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        onError?.(event.error);
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [language, onResult, onError, timeout, commands, stopListening]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      onError?.('Speech recognition not available');
      return;
    }
    if (isListening) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      onError?.('Failed to start speech recognition');
    }
  }, [isSupported, isListening, onError]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, isSupported, startListening, stopListening, toggleListening };
};


