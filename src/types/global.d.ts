// The browser-built SpeechRecognition interface
declare interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  // …etc. (you can omit the other handlers if you don’t use them)…
}

// The constructor type for SpeechRecognition
declare interface SpeechRecognitionConstructor {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
}

// Extend the global Window type
declare interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

declare interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}