
import { useState, useEffect } from "react";
import { Shuffle, CheckCircle, XCircle, RotateCcw, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";

const WordScramble = () => {
  const words = [
    { word: "FRIEND", hint: "Someone you like to play with" },
    { word: "SCHOOL", hint: "Where you go to learn" },
    { word: "FAMILY", hint: "People who live with you" },
    { word: "ANIMAL", hint: "Dogs, cats, and birds are these" },
    { word: "GARDEN", hint: "Where flowers and plants grow" },
    { word: "KITCHEN", hint: "Room where you cook food" },
    { word: "BICYCLE", hint: "Two-wheeled vehicle you pedal" },
    { word: "RAINBOW", hint: "Colorful arc in the sky after rain" }
  ];

  const [currentWord, setCurrentWord] = useState(words[0]);
  const [scrambledWord, setScrambledWord] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const { playSound } = useSoundEffects();

  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
    onResult: (transcript) => {
      const cleanedTranscript = transcript.toUpperCase().replace(/[^A-Z]/g, '');
      setUserAnswer(cleanedTranscript);
      playSound('click');
    },
    onError: (error) => {
      toast({
        title: "Voice Recognition Error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive"
      });
    }
  });

  const scrambleWord = (word: string) => {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join('');
  };

  const nextWord = () => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    setScrambledWord(scrambleWord(randomWord.word));
    setUserAnswer("");
    setShowResult(false);
    playSound('click');
  };

  const checkAnswer = () => {
    const correct = userAnswer.toUpperCase() === currentWord.word;
    setIsCorrect(correct);
    setShowResult(true);
    setAttempts(attempts + 1);

    if (correct) {
      setScore(score + 1);
      playSound('correct');
      toast({
        title: "Correct! 🎉",
        description: "Great job! You unscrambled the word!",
      });
      setTimeout(() => {
        nextWord();
        if ((score + 1) % 5 === 0) {
          playSound('levelup');
        }
      }, 2000);
    } else {
      playSound('incorrect');
      toast({
        title: "Try Again!",
        description: "That's not quite right. Keep trying!",
        variant: "destructive"
      });
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    nextWord();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-purple-600 mb-2">🔤 Word Scramble</h3>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Score: {score}/{attempts}</span>
          <span>Accuracy: {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="bg-purple-100 rounded-lg p-4 mb-4">
          <p className="text-2xl font-bold text-purple-800 tracking-widest mb-2">
            {scrambledWord}
          </p>
          <p className="text-sm text-gray-600">💡 Hint: {currentWord.hint}</p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            placeholder="Type the unscrambled word..."
            className="flex-1 p-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            disabled={showResult}
          />
          
          {isSupported && (
            <button
              onClick={handleVoiceToggle}
              disabled={showResult}
              className={`px-3 py-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-50`}
              title={isListening ? "Stop listening" : "Click to speak your answer"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            playSound('click');
            checkAnswer();
          }}
          disabled={!userAnswer.trim() || showResult}
          className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Check Answer
        </button>
        
        <button
          onClick={() => {
            playSound('click');
            setScrambledWord(scrambleWord(currentWord.word));
          }}
          className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 flex items-center justify-center"
          title="Scramble again"
        >
          <Shuffle className="h-4 w-4" />
        </button>
      </div>

      {showResult && (
        <div className={`text-center p-3 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isCorrect ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Correct! The word was "{currentWord.word}"</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <XCircle className="h-5 w-5" />
              <span>The correct word is "{currentWord.word}"</span>
            </div>
          )}
        </div>
      )}

      {!showResult && (
        <button
          onClick={nextWord}
          className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Skip Word
        </button>
      )}

      {isListening && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Listening... Speak your answer clearly
          </div>
        </div>
      )}
    </div>
  );
};

export default WordScramble;
