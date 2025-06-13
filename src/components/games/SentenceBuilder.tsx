
import { useState, useEffect } from "react";
import { CheckCircle, RotateCcw, Shuffle, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";

interface Word {
  id: string;
  text: string;
  position?: number;
}

const SentenceBuilder = () => {
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
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const { playSound } = useSoundEffects();

  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
    onResult: (transcript) => {
      // Process the spoken sentence and try to match words
      const spokenWords = transcript.toLowerCase().split(' ').map(w => w.trim()).filter(w => w);
      const targetWords = currentSentence.words.map(w => w.toLowerCase());
      
      // Auto-arrange words if the spoken sentence matches
      if (spokenWords.length === targetWords.length) {
        const newSlots: (Word | null)[] = new Array(targetWords.length).fill(null);
        const usedWordIds: string[] = [];
        
        spokenWords.forEach((spokenWord, index) => {
          const matchingAvailableWord = availableWords.find(w => 
            w.text.toLowerCase() === spokenWord && !usedWordIds.includes(w.id)
          );
          
          if (matchingAvailableWord) {
            newSlots[index] = matchingAvailableWord;
            usedWordIds.push(matchingAvailableWord.id);
          }
        });
        
        setSentenceSlots(newSlots);
        setAvailableWords(prev => prev.filter(w => !usedWordIds.includes(w.id)));
        playSound('click');
        
        toast({
          title: "Voice Input Processed",
          description: "I've arranged the words based on what you said!",
        });
      } else {
        toast({
          title: "Voice Input",
          description: "Please speak the complete sentence clearly.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Voice Recognition Error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive"
      });
    }
  });

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

  const checkSentence = () => {
    const builtSentence = sentenceSlots
      .filter(word => word !== null)
      .map(word => word!.text)
      .join(' ') + '.';
    
    const isCorrect = builtSentence === currentSentence.correct;
    setAttempts(attempts + 1);

    if (isCorrect) {
      setScore(score + 1);
      playSound('correct');
      toast({
        title: "Perfect! 🎉",
        description: "You built the sentence correctly!",
      });
      setTimeout(() => {
        initializeGame();
        if ((score + 1) % 5 === 0) {
          playSound('levelup');
        }
      }, 2000);
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

  useEffect(() => {
    initializeGame();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-blue-600 mb-2">🧩 Sentence Builder</h3>
        <p className="text-sm text-gray-600 mb-2">Drag words to build a correct sentence!</p>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Score: {score}/{attempts}</span>
          <span>Accuracy: {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%</span>
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
              🎤 Listening... Speak the complete sentence clearly
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
          onClick={() => {
            playSound('click');
            checkSentence();
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
          onClick={initializeGame}
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
