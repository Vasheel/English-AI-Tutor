// src/global.d.ts

// SpeechRecognition events
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// Web‐Speech API types
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
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

// The browser‐built Recognition interface
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
  abort(): void;
}

// The constructor signature
interface SpeechRecognitionConstructor {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
}

// Extend the global Window
interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
