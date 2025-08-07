import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Shuffle, CheckCircle, XCircle, RotateCcw, Mic, MicOff, Lightbulb, RefreshCw, Brain } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { useAdaptiveDifficulty, AIQuestion } from "@/hooks/useAdaptiveDifficulty";
import { psacVocabulary, generateGrammarQuestion } from '../psacVocabulary.ts';
import { 
  getRandomWord, 
  getRandomGrammarQuestion, 
  resetUsedContent,
  getUsageStats 
} from '@/utils/dynamicContentGenerator';
import { 
  generateAIWordScramble, 
  generateAIQuestions, 
  clearAICache,
  getAICacheStats 
} from '@/utils/aiQuestionGenerator';

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
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<AIQuestion | null>(null);
  const [aiQuestionLoading, setAiQuestionLoading] = useState(false);

  // Use a ref to store the current word so voice recognition can access the latest value
  const currentWordRef = useRef(null);
  const questionStartTimeRef = useRef<number | null>(null);

  const { playSound } = useSoundEffects();
  const { updateProgress, addSession, getProgressByType } = useSupabaseProgress();
  
  // Session timer to track actual time spent
  const { seconds: sessionTime, getFormattedTime } = useSessionTimer();

  // Adaptive difficulty system
  const {
    currentDifficulty,
    accuracy,
    avgResponseTime,
    startQuestionTimer,
    getElapsedTime,
    updateStudentProgress,
    generateAIQuestion,
    getCachedQuestion,
    loading: adaptiveLoading
  } = useAdaptiveDifficulty('word_scramble');

  const nextWord = useCallback(async () => {
    // Try to get AI-generated word first, fallback to static content
    let rawWord;
    try {
      const aiWord = await generateAIWordScramble(
        currentDifficulty === 1 ? 'easy' : currentDifficulty === 2 ? 'medium' : 'hard'
      );
      rawWord = {
        word: aiWord.word,
        hint: aiWord.hint,
        topic: aiWord.topic
      };
    } catch (error) {
      console.error('AI word generation failed, using fallback:', error);
      rawWord = getRandomWord();
    }
    
    const cleanedWord = rawWord.word.trim().toUpperCase();
    
    const newWord = { ...rawWord, word: cleanedWord };
    
    setCurrentWord(newWord);
    // Update the ref with the new word
    currentWordRef.current = newWord;
    
    setScrambledWord(scrambleWord(cleanedWord));
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setHintsUsed(0);
    setShowHint(false);
    
    // Start tracking time for this question
    startQuestionTimer();
    questionStartTimeRef.current = Date.now();
    
    // Generate AI questions for grammar and vocabulary
    setAiQuestionLoading(true);
    try {
      // Generate AI grammar questions
      const aiQuestions = await generateAIQuestions(
        currentDifficulty === 1 ? 'easy' : currentDifficulty === 2 ? 'medium' : 'hard',
        'grammar',
        1
      );
      
      if (aiQuestions.length > 0) {
        const aiQuestion = aiQuestions[0];
        setCurrentQuiz({
          question: aiQuestion.question,
          options: aiQuestion.options || [],
          answer: aiQuestion.correctAnswer
        });
      } else {
        // Fallback to static grammar question
        setCurrentQuiz(getRandomGrammarQuestion(rawWord));
      }
      
      // Generate AI vocabulary question
      const vocabQuestions = await generateAIQuestions(
        currentDifficulty === 1 ? 'easy' : currentDifficulty === 2 ? 'medium' : 'hard',
        'vocabulary',
        1
      );
      
      if (vocabQuestions.length > 0) {
        const vocabQuestion = vocabQuestions[0];
        setAiQuestion({
          question: vocabQuestion.question,
          options: vocabQuestion.options || [],
          answer: vocabQuestion.correctAnswer,
          explanation: vocabQuestion.explanation
        });
      } else {
        // Fallback to cached question
        const cachedQuestion = await getCachedQuestion(currentDifficulty);
        if (cachedQuestion) {
          setAiQuestion(cachedQuestion);
        }
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      // Fallback to static content
      setCurrentQuiz(getRandomGrammarQuestion(rawWord));
      const cachedQuestion = await getCachedQuestion(currentDifficulty);
      if (cachedQuestion) {
        setAiQuestion(cachedQuestion);
      }
    } finally {
      setAiQuestionLoading(false);
    }
    
    playSound("click");
  }, [playSound, currentDifficulty, startQuestionTimer, getCachedQuestion, generateAIQuestion]);

  const updateProgressData = useCallback(async (correct: boolean) => {
    const currentProgress = getProgressByType('word_scramble');
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 60000); // Convert to minutes
    
    // Update user progress
    await updateProgress('word_scramble', {
      total_attempts: (currentProgress?.total_attempts || 0) + 1,
      correct_answers: (currentProgress?.correct_answers || 0) + (correct ? 1 : 0),
      total_time_spent: (currentProgress?.total_time_spent || 0) + Math.max(1, timeSpent),
      current_streak: correct ? (currentProgress?.current_streak || 0) + 1 : 0,
      best_streak: correct ? Math.max((currentProgress?.best_streak || 0), (currentProgress?.current_streak || 0) + 1) : (currentProgress?.best_streak || 0)
    });

    // Add session record
    await addSession({
      user_id: '', // Will be filled by the hook
      activity_type: 'word_scramble',
      score: correct ? 1 : 0,
      total_questions: 1,
      time_spent: Math.max(30, Math.floor((Date.now() - sessionStartTime) / 1000)), // In seconds
      difficulty_level: currentDifficulty,
      session_data: {
        word_scramble_data: {
          word: currentWordRef.current?.word || '',
          user_answer: userAnswer,
          correct: correct,
          hints_used: hintsUsed,
          response_time: getElapsedTime()
        }
      }
    });

    // Update adaptive difficulty progress
    const responseTime = getElapsedTime();
    await updateStudentProgress(
      correct,
      responseTime,
      hintsUsed,
      {
        questionText: `Unscramble the word: ${scrambledWord}`,
        userAnswer: userAnswer,
        correctAnswer: currentWordRef.current?.word || '',
        aiGenerated: false
      }
    );

    // Reset session timer
    setSessionStartTime(Date.now());
  }, [updateProgress, addSession, getProgressByType, userAnswer, sessionStartTime, currentDifficulty, getElapsedTime, updateStudentProgress, scrambledWord, hintsUsed]);

  const checkAnswer = useCallback(async (
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

    // Update progress in Supabase
    await updateProgressData(correct);

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
  }, [userAnswer, playSound, score, nextWord, updateProgressData]);

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

  const handleShowHint = () => {
    if (!showHint) {
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
      playSound('click');
    }
  };

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
    // Reset used content when component mounts to ensure fresh content
    resetUsedContent();
    nextWord();
    setSessionStartTime(Date.now());
  }, [nextWord]);

  // Add a function to show usage stats (for debugging)
  const showUsageStats = () => {
    const stats = getUsageStats();
    console.log('📊 Content Usage Stats:', stats);
    toast({
      title: "Content Stats",
      description: `${stats.usedWords}/${stats.totalWords} words used, ${stats.remainingWords} remaining`,
    });
  };

  if (adaptiveLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading adaptive difficulty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-purple-600 mb-2">🔤 Word Scramble</h3>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Score: {score}/{attempts}</span>
          <span>Accuracy: {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%</span>
          <span>Session: {getFormattedTime()}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Difficulty: {currentDifficulty}/3</span>
          <span>Avg Time: {Math.round(avgResponseTime)}s</span>
          <span>Hints: {hintsUsed}</span>
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
          {showHint && currentWord && (
            <p className="text-xs text-blue-600 mt-2">
              💡 Extra hint: {currentWord.word.length} letters, starts with "{currentWord.word[0]}"
            </p>
          )}
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
      
      {/* AI Generated Question */}
      {aiQuestion && !aiQuestionLoading && (
        <div className="bg-blue-50 p-3 rounded mb-4">
          <div className="font-semibold mb-2 text-blue-800">🧠 AI Challenge (Level {currentDifficulty}):</div>
          <div className="mb-2 text-sm">{aiQuestion.question}</div>
          {aiQuestion.options && (
            <div className="space-y-1">
              {aiQuestion.options.map((option, idx) => (
                <div key={idx} className="text-xs text-gray-700">
                  {String.fromCharCode(65 + idx)}. {option}
                </div>
              ))}
            </div>
          )}
          {aiQuestion.explanation && (
            <div className="text-xs text-blue-600 mt-2">
              💡 {aiQuestion.explanation}
            </div>
          )}
        </div>
      )}

      {aiQuestionLoading && (
        <div className="bg-blue-50 p-3 rounded mb-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">Generating AI question...</span>
          </div>
        </div>
      )}
      
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

        <button
          onClick={handleShowHint}
          disabled={showHint || showResult}
          className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Get a hint"
        >
          <Lightbulb className="h-4 w-4" />
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
        <div className="space-y-2">
          <button
            onClick={nextWord}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Skip Word
          </button>
          
          <button
            onClick={() => {
              resetUsedContent();
              clearAICache();
              nextWord();
              toast({
                title: "Content Reset",
                description: "All content has been reset for fresh variety!",
              });
            }}
            className="w-full bg-blue-300 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-400 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Content
          </button>
          
          <button
            onClick={() => {
              const stats = getAICacheStats();
              console.log('🤖 AI Cache Stats:', stats);
              toast({
                title: "AI Cache Stats",
                description: `${stats.totalCachedQuestions} questions, ${stats.totalCachedWords} words cached`,
              });
            }}
            className="w-full bg-purple-300 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-400 flex items-center justify-center gap-2"
          >
            <Brain className="h-4 w-4" />
            AI Stats
          </button>
        </div>
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
