
import { useState, useEffect } from "react";
import { Shuffle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  };

  const checkAnswer = () => {
    const correct = userAnswer.toUpperCase() === currentWord.word;
    setIsCorrect(correct);
    setShowResult(true);
    setAttempts(attempts + 1);

    if (correct) {
      setScore(score + 1);
      toast({
        title: "Correct! 🎉",
        description: "Great job! You unscrambled the word!",
      });
      setTimeout(nextWord, 2000);
    } else {
      toast({
        title: "Try Again!",
        description: "That's not quite right. Keep trying!",
        variant: "destructive"
      });
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

        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
          placeholder="Type the unscrambled word..."
          className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          disabled={showResult}
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={checkAnswer}
          disabled={!userAnswer.trim() || showResult}
          className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Check Answer
        </button>
        
        <button
          onClick={() => setScrambledWord(scrambleWord(currentWord.word))}
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
    </div>
  );
};

export default WordScramble;
