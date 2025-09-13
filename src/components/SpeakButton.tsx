import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface SpeakButtonProps {
  className?: string;
}

const SpeakButton = ({ className = "fixed top-20 left-4 z-50" }: SpeakButtonProps) => {
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Voice recognition for navigation
  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
    onResult: (transcript) => {
      handleVoiceCommand(transcript);
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
    }
  });

  // Handle voice commands for navigation
  const handleVoiceCommand = useCallback((command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('home') || lowerCommand.includes('main')) {
      navigate('/');
    } else if (lowerCommand.includes('grammar')) {
      navigate('/grammar');
    } else if (lowerCommand.includes('games') || lowerCommand.includes('game')) {
      navigate('/games');
    } else if (lowerCommand.includes('reading')) {
      navigate('/reading');
    } else if (lowerCommand.includes('progress')) {
      navigate('/progress');
    } else if (lowerCommand.includes('exercise')) {
      navigate('/exercise-generator');
    } else if (lowerCommand.includes('close') || lowerCommand.includes('cloze')) {
      navigate('/cloze');
    } else if (lowerCommand.includes('smart') || lowerCommand.includes('adaptive')) {
      navigate('/adaptive-quiz');
    } else if (lowerCommand.includes('image')) {
      navigate('/image-quiz');
    } else if (lowerCommand.includes('chat') || lowerCommand.includes('psac')) {
      navigate('/chat');
    } else if (lowerCommand.includes('topic') || lowerCommand.includes('question')) {
      navigate('/ai-demo');
    }
  }, [navigate]);

  // Speak function
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      speak('Listening for your command. You can say home, grammar, games, reading, progress, exercises, close test, smart quiz, image quiz, chat, or topic questions.');
    }
  }, [isListening, startListening, stopListening, speak]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={className}>
      <button
        onClick={toggleListening}
        aria-label={isListening ? "Stop Listening" : "Start Listening"}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center text-white
          bg-red-500 hover:bg-red-600 transition-colors duration-200
          ${isListening ? "bg-red-700" : ""}
          shadow-lg hover:shadow-xl
        `}
      >
        {isListening && (
          <span className="absolute inset-0 rounded-full ring-2 ring-red-400 animate-ping" />
        )}
        {isListening ? (
          <svg className="relative w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
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
    </div>
  );
};

export default SpeakButton;
