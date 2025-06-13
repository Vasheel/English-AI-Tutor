import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "./ui/button";
import { useNavigate } from 'react-router-dom';

// Use the built-in SpeechRecognition interface from TypeScript's DOM types
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

// Declare the global window properties for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof globalThis.SpeechRecognition;
    webkitSpeechRecognition: typeof globalThis.SpeechRecognition;
  }
}

const VoiceControls = () => {
  const navigate = useNavigate();
  // Check if Web Speech API is supported
  const isSpeechApiSupported = ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) as boolean;
  const isTtsApiSupported = 'SpeechSynthesisUtterance' in window;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Initialize speech synthesis
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

  // Add state for previous interactions
  const [interactionHistory, setInteractionHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle speech input
  const handleSpeechInput = useCallback((text: string) => {
    console.log('Speech recognized:', text);
    
    // Add to interaction history
    setInteractionHistory(prev => [...prev, `You: ${text}`]);
    
    // Process the command
    try {
      const lowerCommand = text.toLowerCase();
      
      // Navigation commands
      if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
        speak('Hello! How can I assist you today?');
      } else if (lowerCommand.includes('time')) {
        const now = new Date();
        speak(`The current time is ${now.toLocaleTimeString()}`);
      } else if (lowerCommand.includes('educational games') || lowerCommand.includes('continue learning')) {
        speak('Opening the educational games section for you!');
        navigate('/games');
      } else if (lowerCommand.includes('reading comprehension') || lowerCommand.includes('reading')) {
        speak('Opening the reading comprehension section for you!');
        navigate('/reading');
      } else if (lowerCommand.includes('exercises') || lowerCommand.includes('practice')) {
        speak('Opening the exercises section for you!');
        navigate('/exercises');
      } else if (lowerCommand.includes('grammar') || lowerCommand.includes('grammar rules')) {
        speak('Opening the grammar section for you!');
        navigate('/grammar');
      } else if (lowerCommand.includes('quizzes') || lowerCommand.includes('test')) {
        speak('Opening the quizzes section for you!');
        navigate('/quizzes');
      } else if (lowerCommand.includes('progress') || lowerCommand.includes('my progress')) {
        speak('Opening your progress section for you!');
        navigate('/progress');
      } else if (lowerCommand.includes('help')) {
        speak('I can help you with these sections: games, reading comprehension, exercises, grammar, quizzes, and progress tracking. What would you like to do?');
      }
      
      // If not a navigation command and we're on grammar page, assume it's a sentence to check
      else if (window.location.pathname === '/grammar') {
        // Emit custom event for grammar correction
        const event = new CustomEvent('speech-input', { 
          detail: { text, type: 'grammar' }
        });
        window.dispatchEvent(event);
        speak(`You said: ${text}`);
      }
      
    } catch (err) {
      setError('Sorry, I had trouble processing your request.');
      speak('I apologize, I had trouble processing your request.');
    }
  }, [speak, navigate]);

  // Initialize speech recognition
  const recognition = useMemo(() => {
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    
    rec.onstart = () => {
      setIsListening(true);
      setError(null);
      speak('Listening for your command...');
    };

    rec.onend = () => {
      setIsListening(false);
      speak('I heard your command.');
    };

    rec.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      // Only emit event when final result is available
      if (event.results[0].isFinal) {
        handleSpeechInput(speechResult);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError('Sorry, I had trouble understanding your speech. Please try again.');
      speak('I apologize, I had trouble understanding your speech. Please try again.');
      setIsListening(false);
    };

    return rec;
  }, [handleSpeechInput, speak]);

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!isSpeechApiSupported) {
      console.error('Speech Recognition API not supported');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  // Speak current text
  const speakCurrentText = () => {
    // TODO: Get the current text you want to speak from your application
    const textToSpeak = 'Hello! How can I assist you today?';
    speak(textToSpeak);
  };

  // Add history display
  const displayHistory = interactionHistory.map((item, index) => (
    <div key={index} className="text-sm text-gray-600 mb-1">
      {item}
    </div>
  ));

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col gap-2">
        {/* Add history display */}
        <div className="bg-white rounded-lg p-3 shadow-md">
          {displayHistory}
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={toggleSpeechRecognition}
          disabled={!isSpeechApiSupported || isSpeaking}
        >
          {isListening ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              Listening...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Speak
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={speakCurrentText}
          disabled={!isTtsApiSupported}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          Listen
        </Button>
      </div>
    </div>
  );
};

export default VoiceControls;
