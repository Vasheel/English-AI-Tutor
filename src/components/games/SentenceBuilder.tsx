import { createContext, useContext, useState, useEffect, useRef } from "react";
import { CheckCircle, RotateCcw, Shuffle, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { ProgressProvider } from "./ProgressContext.tsx";
import { useProgress } from "./ProgressContextExports.tsx";

interface Word {
  id: string;
  text: string;
  position?: number;
}

interface ProgressState {
  score: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  sessionStartTime: number;
  sessionDuration: number;
  currentLevel: number;
  wordsMastered: number;
  consecutiveCorrect: number;
}

interface ProgressContextType {
  progress: ProgressState;
  updateProgress: (updates: Partial<ProgressState>) => void;
  resetProgress: () => void;
}

const SentenceBuilder = () => {
  const { progress, updateProgress } = useProgress();
  const { updateProgress: updateSupabaseProgress, fetchProgress } = useSupabaseProgress();
  const sentences = [
    { 
      words: ["The", "cat", "sits", "on", "the", "mat"],
      correct: "The cat sits on the mat."
    },
    { 
      words: ["I", "like", "to", "read", "books"],
      correct: "I like to read books."
    },
    { 
      words: ["She", "plays", "with", "her", "dog"],
      correct: "She plays with her dog."
    },
    { 
      words: ["We", "go", "to", "school", "every", "day"],
      correct: "We go to school every day."
    }
  ];

  const [currentSentence, setCurrentSentence] = useState(sentences[0]);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [sentenceSlots, setSentenceSlots] = useState<(Word | null)[]>([]);
  const [draggedWord, setDraggedWord] = useState<Word | null>(null);
  const [attempts, setAttempts] = useState(0);
  // Add state to show last transcript
  const [lastTranscript, setLastTranscript] = useState<string>("");
  // Add a ref to always point to the latest currentSentence
  const currentSentenceRef = useRef(currentSentence);
  useEffect(() => {
    currentSentenceRef.current = currentSentence;
  }, [currentSentence]);
  // Add a ref to lock the sentence at the start of listening
  const listeningSentenceRef = useRef(currentSentence);

  // Add a ref to always point to the latest currentSentence
  useEffect(() => {
    currentSentenceRef.current = currentSentence;
  }, [currentSentence]);

  const { playSound } = useSoundEffects();
  
  // Session timer to track actual time spent
  const { seconds: sessionTime, getFormattedTime } = useSessionTimer();

  // Patch startListening to lock the sentence
  const { isListening, isSupported, startListening: origStartListening, stopListening } = useVoiceRecognition({
    onResult: (transcript) => {
      console.log('Voice transcript:', transcript);
      processVoiceInput(transcript);
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      toast({
        title: "Voice Recognition Error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive"
      });
    }
  });
  // Wrap startListening to lock the sentence
  const startListening = () => {
    listeningSentenceRef.current = currentSentenceRef.current;
    origStartListening();
  };

  // Use the ref in processVoiceInput
  const processVoiceInput = (transcript: string) => {
    setLastTranscript(transcript); // Show transcript to user
    // Clean up the transcript
    const cleanTranscript = transcript.toLowerCase().trim();
    
    // Remove punctuation for comparison
    const cleanSpoken = cleanTranscript.replace(/[.,!?;:]/g, '');
    // Use the locked sentence from ref
    const sentence = listeningSentenceRef.current;
    const cleanCorrect = sentence.correct.toLowerCase().replace(/[.,!?;:]/g, '');
    
    console.log('Clean spoken:', cleanSpoken);
    console.log('Clean correct:', cleanCorrect);
    console.log('Current sentence:', sentence);
    
    // Helper: word overlap
    function wordOverlap(a: string, b: string) {
      const aWords = a.split(' ');
      const bWords = b.split(' ');
      let matches = 0;
      aWords.forEach(word => {
        if (bWords.includes(word)) matches++;
      });
      return matches / bWords.length;
    }

    // Check if the spoken sentence matches the correct sentence
    if (cleanSpoken === cleanCorrect) {
      // Automatically arrange all words in correct order
      arrangeWordsFromSpeech();
      
      toast({
        title: "Perfect! 🎉",
        description: "Voice input recognized correctly! Words arranged automatically.",
      });
      
      // Auto-check the sentence after a brief delay
      setTimeout(() => {
        checkSentence();
      }, 1000);
      
    } else {
      // Try partial matching - arrange words that match
      const spokenWords = cleanSpoken.split(' ').filter(w => w.length > 0);
      const targetWords = sentence.words.map(w => w.toLowerCase());
      
      console.log('Spoken words:', spokenWords);
      console.log('Target words:', targetWords);
      
      // Check if all target words are present in spoken words
      const allTargetWordsPresent = targetWords.every(targetWord => 
        spokenWords.includes(targetWord)
      );
      
      // Fuzzy match: at least 70% overlap
      const overlap = wordOverlap(cleanSpoken, cleanCorrect);
      if (overlap >= 0.7) {
        arrangeWordsFromSpeech(spokenWords);
        toast({
          title: "Almost perfect!",
          description: `I heard: "${transcript}". That's close enough! Words arranged as you spoke them.`,
        });
        setTimeout(() => {
          checkSentence();
        }, 1000);
      } else if (allTargetWordsPresent && spokenWords.length === targetWords.length) {
        arrangeWordsFromSpeech(spokenWords);
        
        toast({
          title: "Words Recognized",
          description: "I've arranged the words as you spoke them. Check if the order is correct!",
        });
      } else {
        toast({
          title: "Speech Not Recognized",
          description: `I heard: "${transcript}". Please try speaking the sentence using the words shown below.`,
          variant: "destructive"
        });
      }
    }
  };

  const arrangeWordsFromSpeech = (spokenWords?: string[]) => {
    // If no spoken words provided, use the correct order
    const wordsToArrange = spokenWords || currentSentence.words.map(w => w.toLowerCase());
    
    // Reset the sentence slots
    const newSlots: (Word | null)[] = new Array(currentSentence.words.length).fill(null);
    const usedWordIds: string[] = [];
    
    // Create a copy of available words to work with
    const allWords = [...availableWords, ...sentenceSlots.filter(w => w !== null)] as Word[];
    
    wordsToArrange.forEach((spokenWord, index) => {
      // Find matching word from available words (case-insensitive)
      const matchingWord = allWords.find(word => 
        word.text.toLowerCase() === spokenWord.toLowerCase() && 
        !usedWordIds.includes(word.id)
      );
      
      if (matchingWord && index < newSlots.length) {
        newSlots[index] = matchingWord;
        usedWordIds.push(matchingWord.id);
      }
    });
    
    // Update state
    setSentenceSlots(newSlots);
    setAvailableWords(allWords.filter(w => !usedWordIds.includes(w.id)));
    playSound('click');
  };

  const initializeGame = () => {
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
    setCurrentSentence(randomSentence);
    
    // Shuffle words
    const shuffled = randomSentence.words
      .map((word, index) => ({ id: `word-${index}`, text: word }))
      .sort(() => Math.random() - 0.5);
    
    setAvailableWords(shuffled);
    setSentenceSlots(new Array(randomSentence.words.length).fill(null));
    playSound('click');
  };

  const handleDragStart = (e: React.DragEvent, word: Word) => {
    setDraggedWord(word);
    e.dataTransfer.effectAllowed = 'move';
    playSound('click');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (!draggedWord) return;

    playSound('click');

    // Remove word from available words
    setAvailableWords(prev => prev.filter(w => w.id !== draggedWord.id));
    
    // Add word to sentence slot
    setSentenceSlots(prev => {
      const newSlots = [...prev];
      // If slot is occupied, move that word back to available
      if (newSlots[slotIndex]) {
        setAvailableWords(curr => [...curr, newSlots[slotIndex]!]);
      }
      newSlots[slotIndex] = draggedWord;
      return newSlots;
    });

    setDraggedWord(null);
  };

  const handleWordClick = (word: Word, fromSlot?: number) => {
    playSound('click');
    if (fromSlot !== undefined) {
      // Move word back to available
      setSentenceSlots(prev => {
        const newSlots = [...prev];
        newSlots[fromSlot] = null;
        return newSlots;
      });
      setAvailableWords(prev => [...prev, word]);
    }
  };

  const checkSentence = async () => {
    const builtSentence = sentenceSlots
      .filter(word => word !== null)
      .map(word => word!.text)
      .join(' ') + '.';
    
    const isCorrect = builtSentence === currentSentence.correct;
    updateProgress({
      totalAttempts: progress.totalAttempts + 1,
      correctAttempts: isCorrect ? progress.correctAttempts + 1 : progress.correctAttempts,
      consecutiveCorrect: isCorrect ? progress.consecutiveCorrect + 1 : 0
    });

    // Update Supabase progress
    try {
      await updateSupabaseProgress("sentence_builder", {
        total_attempts: 1,
        correct_answers: isCorrect ? 1 : 0,
        total_time_spent: sessionTime, // Use actual session time
        current_level: 1,
        current_streak: isCorrect ? 1 : 0,
        best_streak: isCorrect ? 1 : 0
      });
      
      // Refresh progress data to update dashboard
      await fetchProgress();
    } catch (error) {
      console.error("Error updating sentence builder progress:", error);
    }

    if (isCorrect) {
      updateProgress({
        score: progress.score + 1,
        wordsMastered: progress.wordsMastered + currentSentence.words.length
      });
      
      playSound('correct');
      toast({
        title: "Perfect! 🎉",
        description: `You built the sentence correctly! Accuracy: ${progress.accuracy}%`,
      });
      
      // Level up logic
      if ((progress.score + 1) % 5 === 0) {
        updateProgress({ currentLevel: progress.currentLevel + 1 });
        playSound('levelup');
      }
    } else {
      playSound('incorrect');
      toast({
        title: "Not quite right",
        description: "Try rearranging the words. The sentence should make sense!",
        variant: "destructive"
      });
    }
  };

  const resetSentence = () => {
    const allWords = [...availableWords, ...sentenceSlots.filter(w => w !== null)] as Word[];
    setAvailableWords(allWords);
    setSentenceSlots(new Array(currentSentence.words.length).fill(null));
    playSound('click');
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Stop listening before starting a new sentence
  const handleNewSentence = () => {
    stopListening();
    initializeGame();
  };

  useEffect(() => {
    initializeGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-blue-600 mb-2">🧩 Sentence Builder</h3>
        <p className="text-sm text-gray-600 mb-2">Drag words to build a correct sentence or speak it aloud!</p>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Score: {progress.score}/{progress.totalAttempts}</span>
          <span>Accuracy: {progress.accuracy}%</span>
          <span>Session: {getFormattedTime()}</span>
        </div>
      </div>

      {/* Voice Input Section */}
      {isSupported && (
        <div className="mb-4 text-center">
          <button
            onClick={handleVoiceToggle}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={isListening ? "Stop listening" : "Click to speak the sentence"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? "Stop Listening" : "Speak Sentence"}
          </button>
          
          {isListening && (
            <div className="mt-2 text-sm text-blue-600">
              🎤 Listening... Speak the sentence clearly
            </div>
          )}
          {/* Show last transcript */}
          {lastTranscript && (
            <div className="mt-2 text-sm text-gray-700">
              <span className="font-semibold">Transcript:</span> "{lastTranscript}"
            </div>
          )}
        </div>
      )}

      {/* Sentence Building Area */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Build your sentence here:</h4>
        <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          {sentenceSlots.map((word, index) => (
            <div
              key={index}
              className="min-w-[80px] h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white relative"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              {word ? (
                <span
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                  onClick={() => handleWordClick(word, index)}
                >
                  {word.text}
                </span>
              ) : (
                <span className="text-gray-400 text-sm">Drop here</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Available Words */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available words:</h4>
        <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-blue-50 rounded-lg">
          {availableWords.map((word) => (
            <span
              key={word.id}
              draggable
              onDragStart={(e) => handleDragStart(e, word)}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg cursor-move hover:bg-blue-600 transition-colors"
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={async () => {
            playSound('click');
            await checkSentence();
          }}
          disabled={sentenceSlots.some(slot => slot === null)}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Check Sentence
        </button>
        
        <button
          onClick={resetSentence}
          className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        
        <button
          onClick={handleNewSentence}
          className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
        >
          <Shuffle className="h-4 w-4" />
          New Sentence
        </button>
      </div>
    </div>
  );
};

export default SentenceBuilder;