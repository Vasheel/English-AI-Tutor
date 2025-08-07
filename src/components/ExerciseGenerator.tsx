
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, RotateCcw, Shuffle, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import { useSessionTimer } from "@/hooks/useSessionTimer";

interface Exercise {
  type: string;
  prompt: string;
  input: string;
  answer: string;
  explanation?: string;
}

interface ExerciseStats {
  score: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

const ExerciseGenerator = () => {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [stats, setStats] = useState<ExerciseStats>({
    score: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    accuracy: 0
  });

  const { playSound } = useSoundEffects();
  const { updateProgress, addSession, getProgressByType } = useSupabaseProgress();
  const { seconds: sessionTime, getFormattedTime } = useSessionTimer();

  // Predefined exercises with correct answers
  const predefinedExercises = [
    // Remove extra word exercises
    {
      type: "remove_extra_word",
      prompt: "Remove the extra word from the sentence.",
      input: "Last week my mother cleaned the an bathroom.",
      answer: "Last week my mother cleaned the bathroom.",
      explanation: "The word 'an' was incorrectly added to the sentence."
    },
    {
      type: "remove_extra_word",
      prompt: "Remove the extra word from the sentence.",
      input: "The cat the sits on the mat.",
      answer: "The cat sits on the mat.",
      explanation: "The word 'the' was incorrectly added to the sentence."
    },
    {
      type: "remove_extra_word",
      prompt: "Remove the extra word from the sentence.",
      input: "She plays with her very dog.",
      answer: "She plays with her dog.",
      explanation: "The word 'very' was incorrectly added to the sentence."
    },

    // Add punctuation exercises
    {
      type: "add_punctuation",
      prompt: "Add the required capital letter and full stop.",
      input: "mary is happy it's her birthday",
      answer: "Mary is happy it's her birthday.",
      explanation: "The first word should be capitalized and the sentence should end with a period."
    },
    {
      type: "add_punctuation",
      prompt: "Add the required capital letter and full stop.",
      input: "the children played on the playground",
      answer: "The children played on the playground.",
      explanation: "The first word should be capitalized and the sentence should end with a period."
    },

    // Adverb placement exercises
    {
      type: "adverb_placement",
      prompt: "Add the adverb 'happily' in the right place.",
      input: "We go to school every day.",
      answer: "We happily go to school every day.",
      explanation: "The adverb 'happily' should be placed before the verb to describe how the action is performed."
    },
    {
      type: "adverb_placement",
      prompt: "Add the adverb 'quickly' in the right place.",
      input: "The children ran to the park.",
      answer: "The children quickly ran to the park.",
      explanation: "The adverb 'quickly' should be placed before the verb to describe how the action is performed."
    },
    {
      type: "adverb_placement",
      prompt: "Add the adverb 'carefully' in the right place.",
      input: "She reads the book.",
      answer: "She carefully reads the book.",
      explanation: "The adverb 'carefully' should be placed before the verb to describe how the action is performed."
    },

    // Word order exercises
    {
      type: "word_order",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "painting – Maya – her – is – room",
      answer: "Maya is painting her room.",
      explanation: "The words need to be arranged in the correct grammatical order to form a meaningful sentence."
    },
    {
      type: "word_order",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "cat – the – sits – mat – on – the",
      answer: "The cat sits on the mat.",
      explanation: "The words need to be arranged in the correct grammatical order to form a meaningful sentence."
    },

    // Negative form exercises
    {
      type: "negative_form",
      prompt: "Transform the sentence into its negative form.",
      input: "The teacher reads a book.",
      answer: "The teacher does not read a book.",
      explanation: "To make a sentence negative, we add 'does not' for third person singular present tense and change the verb to base form."
    },
    {
      type: "negative_form",
      prompt: "Transform the sentence into its negative form.",
      input: "The fisherman sat on the beach.",
      answer: "The fisherman did not sit on the beach.",
      explanation: "To make a sentence negative in past tense, we add 'did not' and change the verb to base form."
    },
    {
      type: "negative_form",
      prompt: "Transform the sentence into its negative form.",
      input: "She plays with her dog.",
      answer: "She does not play with her dog.",
      explanation: "To make a sentence negative, we add 'does not' for third person singular present tense and change the verb to base form."
    },

    // Interrogative form exercises
    {
      type: "interrogative_form",
      prompt: "Transform the sentence into its interrogative form.",
      input: "The girl will recite a poem.",
      answer: "Will the girl recite a poem?",
      explanation: "To make a question, we move the auxiliary verb 'will' to the beginning."
    },
    {
      type: "interrogative_form",
      prompt: "Transform the sentence into its interrogative form.",
      input: "She plays with her dog.",
      answer: "Does she play with her dog?",
      explanation: "To make a question, we add 'does' for third person singular present tense and change the verb to base form."
    },
    {
      type: "interrogative_form",
      prompt: "Transform the sentence into its interrogative form.",
      input: "The teacher reads a book.",
      answer: "Does the teacher read a book?",
      explanation: "To make a question, we add 'does' for third person singular present tense and change the verb to base form."
    },

    // Use given words exercises
    {
      type: "use_given_words",
      prompt: "Write one sentence using the following words: cyclone – radio",
      input: "cyclone – radio",
      answer: "Sample: The cyclone damaged the radio.",
      explanation: "Write a meaningful sentence that includes both words: 'cyclone' and 'radio'."
    },
    {
      type: "use_given_words",
      prompt: "Write one sentence using the following words: teacher – student",
      input: "teacher – student",
      answer: "Sample: The teacher helps the student.",
      explanation: "Write a meaningful sentence that includes both words: 'teacher' and 'student'."
    }
  ];

  // Remove the old generator functions and replace with simple random selection
  const generateRandomExercise = (): Exercise => {
    return predefinedExercises[Math.floor(Math.random() * predefinedExercises.length)];
  };

  // Function to validate sentence using ChatGPT
  const validateSentenceWithAI = async (userSentence: string, requiredWords: string[]): Promise<{ isValid: boolean; feedback: string }> => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an English grammar expert. Evaluate if the given sentence is grammatically correct and contains the required words. Respond with JSON only: {\"isValid\": true/false, \"feedback\": \"explanation\"}"
            },
            {
              role: "user",
              content: `Evaluate this sentence: "${userSentence}". Required words: ${requiredWords.join(', ')}. Is it a complete, grammatically correct sentence that uses both required words meaningfully?`
            }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        try {
          const result = JSON.parse(data.choices[0].message.content);
          return result;
        } catch (e) {
          // Fallback if JSON parsing fails
          return {
            isValid: false,
            feedback: "Unable to validate sentence. Please ensure it's a complete, grammatically correct sentence using both required words."
          };
        }
      }
    } catch (error) {
      console.error("Error validating with AI:", error);
    }
    
    // Fallback validation
    return {
      isValid: userSentence.length > 10 && requiredWords.every(word => 
        userSentence.toLowerCase().includes(word.toLowerCase())
      ),
      feedback: "Please write a complete sentence using both required words."
    };
  };

  // Function to generate correct answer using ChatGPT
  const generateCorrectAnswerWithAI = async (exerciseType: string, input: string): Promise<string> => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an English grammar expert. Provide the correct answer for grammar exercises. Respond with only the correct answer, no explanations."
            },
            {
              role: "user",
              content: `Exercise type: ${exerciseType}. Input: ${input}. What is the correct answer?`
            }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }
    } catch (error) {
      console.error("Error generating answer with AI:", error);
    }
    
    return "Unable to generate answer at this time.";
  };

  const checkAnswer = useCallback(async () => {
    if (!currentExercise) return;

    const cleanUserAnswer = userAnswer.trim();
    const cleanCorrectAnswer = currentExercise.answer.trim();
    let isCorrect = false; // Declare isCorrect at the beginning
    
    // For "use_given_words" type, use AI validation
    if (currentExercise.type === "use_given_words") {
      setIsValidating(true);
      const words = currentExercise.input.split(' – ');
      const validation = await validateSentenceWithAI(cleanUserAnswer, words);
      setIsValidating(false);
      
      isCorrect = validation.isValid; // Set isCorrect here
      setIsCorrect(isCorrect);
      setShowResult(true);
      
      if (isCorrect) {
        playSound("correct");
        toast({
          title: "Great job! 🎉",
          description: "You used both words correctly in your sentence!",
        });
      } else {
        playSound("incorrect");
        toast({
          title: "Try again!",
          description: validation.feedback,
          variant: "destructive",
        });
      }
    } else {
      // For other types, do fuzzy matching
      isCorrect = cleanUserAnswer.toLowerCase() === cleanCorrectAnswer.toLowerCase(); // Set isCorrect here
      setIsCorrect(isCorrect);
      setShowResult(true);
      
      if (isCorrect) {
        playSound("correct");
        toast({
          title: "Correct! 🎉",
          description: "Well done!",
        });
      } else {
        playSound("incorrect");
        toast({
          title: "Not quite right",
          description: `The correct answer is: "${currentExercise.answer}"`,
          variant: "destructive",
        });
      }
    }

    // Update stats
    const newStats = {
      ...stats,
      totalAttempts: stats.totalAttempts + 1,
      correctAttempts: stats.correctAttempts + (isCorrect ? 1 : 0),
      score: stats.score + (isCorrect ? 1 : 0)
    };
    newStats.accuracy = Math.round((newStats.correctAttempts / newStats.totalAttempts) * 100);
    setStats(newStats);

    // Update Supabase progress
    try {
      const currentProgress = getProgressByType('grammar_exercises');
      await updateProgress("grammar_exercises", {
        total_attempts: (currentProgress?.total_attempts || 0) + 1,
        correct_answers: (currentProgress?.correct_answers || 0) + (isCorrect ? 1 : 0),
        total_time_spent: (currentProgress?.total_time_spent || 0) + Math.max(1, Math.floor(sessionTime / 60)), // Convert to minutes
        current_streak: isCorrect ? (currentProgress?.current_streak || 0) + 1 : 0,
        best_streak: isCorrect ? Math.max((currentProgress?.best_streak || 0), (currentProgress?.current_streak || 0) + 1) : (currentProgress?.best_streak || 0)
      });

      await addSession({
        user_id: '', // Will be filled by the hook
        activity_type: 'grammar_exercises',
        score: isCorrect ? 1 : 0,
        total_questions: 1,
        time_spent: Math.max(30, sessionTime),
        difficulty_level: 1,
        session_data: {
          grammar_exercise_data: {
            exercise_type: currentExercise.type,
            user_answer: userAnswer,
            correct: isCorrect
          }
        }
      });
    } catch (error) {
      console.error("Error updating grammar exercise progress:", error);
    }
  }, [currentExercise, userAnswer, stats, playSound, updateProgress, addSession, sessionTime, getProgressByType]);

  const nextExercise = useCallback(() => {
    const newExercise = generateRandomExercise();
    setCurrentExercise(newExercise);
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    playSound("click");
  }, [playSound]);

  const retryExercise = () => {
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setShowCorrectAnswer(false);
    playSound("click");
  };

  const showAnswer = () => {
    setShowCorrectAnswer(true);
    playSound("click");
  };

  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
    onResult: (transcript) => {
      setUserAnswer(transcript);
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

  useEffect(() => {
    nextExercise();
  }, [nextExercise]);

  if (!currentExercise) {
    return <div>Loading exercise...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-green-600 mb-2">📝 Grammar Exercise</h3>
        <p className="text-sm text-gray-600 mb-2">Practice your grammar skills with dynamic exercises!</p>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Score: {stats.score}/{stats.totalAttempts}</span>
          <span>Accuracy: {stats.accuracy}%</span>
          <span>Session: {getFormattedTime()}</span>
        </div>
      </div>

      {/* Exercise Display */}
      <div className="mb-6">
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-green-800 mb-2">Question:</h4>
          <p className="text-lg text-green-700">{currentExercise.prompt}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Input:</h4>
          <p className="text-lg text-gray-700 font-mono">{currentExercise.input}</p>
        </div>
      </div>

      {/* Answer Input */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !showResult) {
                checkAnswer();
              }
            }}
            placeholder="Type your answer here..."
            className="flex-1 p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
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

        {isListening && (
          <div className="text-center text-sm text-blue-600">
            🎤 Listening... Speak your answer clearly
          </div>
        )}
      </div>

      {/* Result Display */}
      {showResult && (
        <div className={`text-center p-4 rounded-lg mb-4 ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            {isValidating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Validating...</span>
              </div>
            ) : isCorrect ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <span>❌</span>
            )}
            <span className="font-semibold">
              {isValidating ? "Validating..." : isCorrect ? "Correct!" : "Not quite right"}
            </span>
          </div>
          {currentExercise.explanation && !isValidating && (
            <p className="text-sm mt-2">{currentExercise.explanation}</p>
          )}
          {!isCorrect && !isValidating && (
            <div className="mt-3 flex gap-2 justify-center">
              <button
                onClick={retryExercise}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={showAnswer}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Show Answer
              </button>
            </div>
          )}
          {showCorrectAnswer && (
            <div className="mt-3 p-2 bg-yellow-100 rounded">
              <p className="text-sm font-semibold">Correct Answer:</p>
              <p className="text-sm">{currentExercise.answer}</p>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={checkAnswer}
          disabled={!userAnswer.trim() || showResult || isValidating}
          className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Validating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Check Answer
            </>
          )}
        </button>
        
        <button
          onClick={nextExercise}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
        >
          <Shuffle className="h-4 w-4" />
          Next Exercise
        </button>
      </div>
    </div>
  );
};

export default ExerciseGenerator;
