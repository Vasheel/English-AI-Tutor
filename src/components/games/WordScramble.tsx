import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Shuffle, CheckCircle, XCircle, RotateCcw, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { psacVocabulary, generateGrammarQuestion } from '../psacVocabulary.ts';

type QuizType = {
  question: string;
  options: string[];
  answer: string;
};

const WordScramble = () => {

const [currentQuiz, setCurrentQuiz] = useState<QuizType | null>(null);
const [currentWord, setCurrentWord] = useState(null);
const [scrambledWord, setScrambledWord] = useState("");
const [userAnswer, setUserAnswer] = useState("");
const [score, setScore] = useState(0);
const [attempts, setAttempts] = useState(0);
const [showResult, setShowResult] = useState(false);
const [isCorrect, setIsCorrect] = useState(false);

// Use a ref to store the current word so voice recognition can access the latest value
const currentWordRef = useRef(null);

const { playSound } = useSoundEffects();

const nextWord = useCallback(() => {
  const rawWord = psacVocabulary[Math.floor(Math.random() * psacVocabulary.length)];
  const cleanedWord = rawWord.word.trim().toUpperCase();
  
  const newWord = { ...rawWord, word: cleanedWord };
  
  setCurrentWord(newWord);
  // Update the ref with the new word
  currentWordRef.current = newWord;
  
  setScrambledWord(scrambleWord(cleanedWord));
  setUserAnswer("");
  setShowResult(false);
  setIsCorrect(false);
  setCurrentQuiz(generateGrammarQuestion(rawWord));
  playSound("click");
}, [playSound]);

const checkAnswer = useCallback((
  input: string = userAnswer,
  isFromVoice: boolean = false,
  targetWord: string = ""
) => {
  // If no targetWord is provided, use the current word from ref
  const wordToCheck = targetWord || currentWordRef.current?.word || "";
  const cleanedInput = input.trim().toUpperCase();
  const correctWord = wordToCheck.trim().toUpperCase();

  console.log("🔍 Comparing:", `"${cleanedInput}"`, "vs", `"${correctWord}"`);

  const correct = cleanedInput === correctWord;
  setIsCorrect(correct);
  setShowResult(true);
  setAttempts((prev) => prev + 1);

  if (correct) {
    setScore((prev) => prev + 1);
    playSound("correct");
    toast({
      title: "Correct! 🎉",
      description: "Great job! You unscrambled the word!",
    });

    if (!isFromVoice) {
      setTimeout(() => {
        nextWord();
        if ((score + 1) % 5 === 0) playSound("levelup");
      }, 2000);
    }
  } else {
    playSound("incorrect");
    toast({
      title: "Try Again!",
      description: "That's not quite right. Keep trying!",
      variant: "destructive",
    });
  }
}, [userAnswer, playSound, score, nextWord]);

const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
  onResult: (transcript) => {
    const cleanedTranscript = transcript.toUpperCase().replace(/[^A-Z]/g, '');
    setUserAnswer(cleanedTranscript);
    playSound('click');

    // Use the current word from ref to ensure we have the latest value
    checkAnswer(cleanedTranscript, true, currentWordRef.current?.word);

    setTimeout(() => {
      nextWord();
    }, 2000);
  },
  onError: (error) => {
    toast({
      title: "Voice Recognition Error",
      description: "Could not recognize speech. Please try again.",
      variant: "destructive"
    });
  }
});

console.log("Voice recognition supported?", isSupported);

const scrambleWord = (word: string) => {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join('');
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
}, [nextWord]);

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
        <p className="text-sm text-gray-600">
          💡 Hint: {currentWord ? currentWord.hint : "Loading..."}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value.trim().toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              checkAnswer(userAnswer, false, currentWord?.word);
            }
          }}
          placeholder="Type or speak the answer..."
          className="flex-1 p-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          disabled={showResult}
        />

        {isSupported && (
          <button
            onClick={startListening}
            disabled={showResult}
            className={`p-3 rounded-lg text-white ${
              isListening
                ? "bg-red-600 animate-pulse"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            title={isListening ? "Stop Listening" : "Click to speak your answer"}
          >
            🎤
          </button>
        )}
      </div>
    </div>
    
    {currentQuiz ? (
      <div className="bg-yellow-100 p-3 rounded mb-4">
        <div className="font-semibold mb-2">🧠 Grammar Check:</div>
        <div className="mb-2">{currentQuiz.question || "No question available."}</div>
        <ul className="list-disc list-inside">
          {(currentQuiz.options || []).map((opt, idx) => (
            <li key={idx}>{opt}</li>
          ))}
        </ul>
      </div>
    ) : (
      <div className="text-sm text-gray-500 italic mb-4">Loading quiz...</div>
    )}

    <div className="flex gap-2 mb-4">
      <button
        onClick={() => {
          playSound('click');
          checkAnswer(userAnswer, false, currentWord?.word);
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