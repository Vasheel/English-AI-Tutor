
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, RotateCcw, Shuffle, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSupabaseProgress } from "@/hooks/useSupabaseProgress";
import { useSessionTimer } from "@/hooks/useSessionTimer";

interface Exercise {
  type: string;
  difficulty: string;
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
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [stats, setStats] = useState<ExerciseStats>({
    score: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    accuracy: 0
  });

  const { playSound } = useSoundEffects();
  const { updateProgress, addSession } = useSupabaseProgress();
  const { seconds: sessionTime, getFormattedTime } = useSessionTimer();

  // Predefined exercises with correct answers - organized by difficulty and type
  const predefinedExercises = [
    // BEGINNER LEVEL - Remove extra word exercises
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "Last week my mother cleaned the an bathroom.",
      answer: "Last week my mother cleaned the bathroom.",
      explanation: "The word 'an' was incorrectly added to the sentence."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "The cat the sits on the mat.",
      answer: "The cat sits on the mat.",
      explanation: "The word 'the' was incorrectly added to the sentence."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "She plays with her very dog.",
      answer: "She plays with her dog.",
      explanation: "The word 'very' was incorrectly added to the sentence."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "I am am very excited.",
      answer: "I am very excited.",
      explanation: "The word 'am' was repeated."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "They went to to the market yesterday.",
      answer: "They went to the market yesterday.",
      explanation: "The word 'to' was repeated unnecessarily."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "He quickly quickly finished his homework.",
      answer: "He quickly finished his homework.",
      explanation: "The word 'quickly' was duplicated."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "The dog is is sleeping on the couch.",
      answer: "The dog is sleeping on the couch.",
      explanation: "The word 'is' was repeated."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "We have have a big garden.",
      answer: "We have a big garden.",
      explanation: "The word 'have' was repeated."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "She can can swim very well.",
      answer: "She can swim very well.",
      explanation: "The word 'can' was repeated."
    },
    {
      type: "remove_extra_word",
      difficulty: "beginner",
      prompt: "Remove the extra word from the sentence.",
      input: "The book is is on the table.",
      answer: "The book is on the table.",
      explanation: "The word 'is' was repeated."
    },

    // BEGINNER LEVEL - Add punctuation exercises
    {
      type: "add_punctuation",
      difficulty: "beginner",
      prompt: "Add the required capital letter and full stop.",
      input: "mary is happy it's her birthday",
      answer: "Mary is happy it's her birthday.",
      explanation: "The first word should be capitalized and the sentence should end with a period."
    },
    {
      type: "add_punctuation",
      difficulty: "beginner",
      prompt: "Add the required capital letter and full stop.",
      input: "the children played on the playground",
      answer: "The children played on the playground.",
      explanation: "The first word should be capitalized and the sentence should end with a period."
    },
    {
      type: "add_punctuation",
      difficulty: "beginner",
      prompt: "Add the required capital letter and full stop.",
      input: "we will visit the museum tomorrow",
      answer: "We will visit the museum tomorrow.",
      explanation: "Capitalize the first word and end with a period."
    },
    {
      type: "add_punctuation",
      difficulty: "beginner",
      prompt: "Add the required capital letter and question mark.",
      input: "what time does the show start",
      answer: "What time does the show start?",
      explanation: "Capitalize the first word and use a question mark for questions."
    },
    {
      type: "add_punctuation",
      difficulty: "beginner",
      prompt: "Fix capitalization and end punctuation.",
      input: "on monday we have a science test",
      answer: "On Monday we have a science test.",
      explanation: "Capitalize proper nouns and end with a period."
    },
    {
      type: "add_punctuation",
      difficulty: "beginner",
      prompt: "Add proper capitalization and punctuation.",
      input: "my name is sarah and i am ten years old",
      answer: "My name is Sarah and I am ten years old.",
      explanation: "Capitalize names, first person pronoun, and end with a period."
    },
    {
      type: "add_punctuation",
      difficulty: "beginner",
      prompt: "Add the required capital letter and exclamation mark.",
      input: "wow that was amazing",
      answer: "Wow that was amazing!",
      explanation: "Capitalize the first word and use an exclamation mark for excitement."
    },
    {
      type: "add_punctuation",
      difficulty: "beginner",
      prompt: "Fix capitalization and punctuation.",
      input: "the dog ran quickly through the park",
      answer: "The dog ran quickly through the park.",
      explanation: "Capitalize the first word and end with a period."
    },

    // INTERMEDIATE LEVEL - Adverb placement exercises
    {
      type: "adverb_placement",
      difficulty: "intermediate",
      prompt: "Add the adverb 'happily' in the right place.",
      input: "We go to school every day.",
      answer: "We happily go to school every day.",
      explanation: "The adverb 'happily' should be placed before the verb to describe how the action is performed."
    },
    {
      type: "adverb_placement",
      difficulty: "intermediate",
      prompt: "Add the adverb 'quickly' in the right place.",
      input: "The children ran to the park.",
      answer: "The children quickly ran to the park.",
      explanation: "The adverb 'quickly' should be placed before the verb to describe how the action is performed."
    },
    {
      type: "adverb_placement",
      difficulty: "intermediate",
      prompt: "Add the adverb 'carefully' in the right place.",
      input: "She reads the book.",
      answer: "She carefully reads the book.",
      explanation: "The adverb 'carefully' should be placed before the verb to describe how the action is performed."
    },
    {
      type: "adverb_placement",
      difficulty: "intermediate",
      prompt: "Add the adverb 'quietly' in the right place.",
      input: "The baby sleeps.",
      answer: "The baby quietly sleeps.",
      explanation: "Place the adverb before the verb to describe how the action is performed."
    },
    {
      type: "adverb_placement",
      difficulty: "intermediate",
      prompt: "Add the adverb 'gently' in the right place.",
      input: "She closed the door.",
      answer: "She gently closed the door.",
      explanation: "The adverb should modify the verb closely."
    },
    {
      type: "adverb_placement",
      difficulty: "intermediate",
      prompt: "Add the adverb 'patiently' in the right place.",
      input: "They waited for the bus.",
      answer: "They patiently waited for the bus.",
      explanation: "Place the adverb before the verb phrase."
    },
    {
      type: "adverb_placement",
      difficulty: "intermediate",
      prompt: "Add the adverb 'suddenly' in the right place.",
      input: "The rain started falling.",
      answer: "The rain suddenly started falling.",
      explanation: "Place the adverb before the verb to show when the action happened."
    },
    {
      type: "adverb_placement",
      difficulty: "intermediate",
      prompt: "Add the adverb 'slowly' in the right place.",
      input: "The turtle walked across the road.",
      answer: "The turtle slowly walked across the road.",
      explanation: "Place the adverb before the verb to describe how the action is performed."
    },

    // INTERMEDIATE LEVEL - Word order exercises
    {
      type: "word_order",
      difficulty: "intermediate",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "painting – Maya – her – is – room",
      answer: "Maya is painting her room.",
      explanation: "The words need to be arranged in the correct grammatical order to form a meaningful sentence."
    },
    {
      type: "word_order",
      difficulty: "intermediate",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "cat – the – sits – mat – on – the",
      answer: "The cat sits on the mat.",
      explanation: "The words need to be arranged in the correct grammatical order to form a meaningful sentence."
    },
    {
      type: "word_order",
      difficulty: "intermediate",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "homework – his – did – he – yesterday",
      answer: "He did his homework yesterday.",
      explanation: "Subject + verb + object + time expression."
    },
    {
      type: "word_order",
      difficulty: "intermediate",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "football – after – plays – school – she",
      answer: "She plays football after school.",
      explanation: "Subject + verb + object + adverbial phrase."
    },
    {
      type: "word_order",
      difficulty: "intermediate",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "breakfast – usually – I – have – at – seven",
      answer: "I usually have breakfast at seven.",
      explanation: "Frequency adverb goes before the main verb."
    },
    {
      type: "word_order",
      difficulty: "intermediate",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "book – reading – is – she – a – interesting",
      answer: "She is reading an interesting book.",
      explanation: "Subject + auxiliary verb + main verb + article + adjective + object."
    },
    {
      type: "word_order",
      difficulty: "intermediate",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "park – children – playing – the – are – in",
      answer: "The children are playing in the park.",
      explanation: "Subject + auxiliary verb + main verb + prepositional phrase."
    },
    {
      type: "word_order",
      difficulty: "intermediate",
      prompt: "Put the words in the correct order to form a proper sentence.",
      input: "cake – birthday – delicious – the – was – very",
      answer: "The birthday cake was very delicious.",
      explanation: "Article + adjective + noun + verb + adverb + adjective."
    },

    // ADVANCED LEVEL - Negative form exercises
    {
      type: "negative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its negative form.",
      input: "The teacher reads a book.",
      answer: "The teacher does not read a book.",
      explanation: "To make a sentence negative, we add 'does not' for third person singular present tense and change the verb to base form."
    },
    {
      type: "negative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its negative form.",
      input: "The fisherman sat on the beach.",
      answer: "The fisherman did not sit on the beach.",
      explanation: "To make a sentence negative in past tense, we add 'did not' and change the verb to base form."
    },
    {
      type: "negative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its negative form.",
      input: "She plays with her dog.",
      answer: "She does not play with her dog.",
      explanation: "To make a sentence negative, we add 'does not' for third person singular present tense and change the verb to base form."
    },
    {
      type: "negative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its negative form.",
      input: "He likes spicy food.",
      answer: "He does not like spicy food.",
      explanation: "Use 'does not' and base verb for third person singular."
    },
    {
      type: "negative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its negative form.",
      input: "They went to the concert.",
      answer: "They did not go to the concert.",
      explanation: "Use 'did not' and base verb in the past tense."
    },
    {
      type: "negative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its negative form.",
      input: "We will travel tomorrow.",
      answer: "We will not travel tomorrow.",
      explanation: "Add 'not' after 'will' for future negative."
    },
    {
      type: "negative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its negative form.",
      input: "I am happy today.",
      answer: "I am not happy today.",
      explanation: "Add 'not' after 'am' for present tense negative."
    },
    {
      type: "negative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its negative form.",
      input: "They are playing outside.",
      answer: "They are not playing outside.",
      explanation: "Add 'not' after 'are' for present continuous negative."
    },

    // ADVANCED LEVEL - Interrogative form exercises
    {
      type: "interrogative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its interrogative form.",
      input: "The girl will recite a poem.",
      answer: "Will the girl recite a poem?",
      explanation: "To make a question, we move the auxiliary verb 'will' to the beginning."
    },
    {
      type: "interrogative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its interrogative form.",
      input: "She plays with her dog.",
      answer: "Does she play with her dog?",
      explanation: "To make a question, we add 'does' for third person singular present tense and change the verb to base form."
    },
    {
      type: "interrogative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its interrogative form.",
      input: "The teacher reads a book.",
      answer: "Does the teacher read a book?",
      explanation: "To make a question, we add 'does' for third person singular present tense and change the verb to base form."
    },
    {
      type: "interrogative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its interrogative form.",
      input: "They are ready for the trip.",
      answer: "Are they ready for the trip?",
      explanation: "Move the verb 'are' to the beginning to form a question."
    },
    {
      type: "interrogative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its interrogative form.",
      input: "She finished her work.",
      answer: "Did she finish her work?",
      explanation: "Use 'did' and base verb to form a past simple question."
    },
    {
      type: "interrogative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its interrogative form.",
      input: "He can solve the problem.",
      answer: "Can he solve the problem?",
      explanation: "Move the modal verb to the front to form a question."
    },
    {
      type: "interrogative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its interrogative form.",
      input: "I am going to the store.",
      answer: "Am I going to the store?",
      explanation: "Move the verb 'am' to the beginning to form a question."
    },
    {
      type: "interrogative_form",
      difficulty: "advanced",
      prompt: "Transform the sentence into its interrogative form.",
      input: "They have finished their homework.",
      answer: "Have they finished their homework?",
      explanation: "Move the auxiliary verb 'have' to the beginning to form a question."
    },

    // CREATIVE LEVEL - Use given words exercises
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: cyclone – radio",
      input: "cyclone – radio",
      answer: "Sample: The cyclone damaged the radio.",
      explanation: "Write a meaningful sentence that includes both words: 'cyclone' and 'radio'."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: teacher – student",
      input: "teacher – student",
      answer: "Sample: The teacher helps the student.",
      explanation: "Write a meaningful sentence that includes both words: 'teacher' and 'student'."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: museum – painting",
      input: "museum – painting",
      answer: "Sample: The museum displayed a beautiful painting.",
      explanation: "Write a sentence that includes both words."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: garden – butterfly",
      input: "garden – butterfly",
      answer: "Sample: A colorful butterfly flew across the garden.",
      explanation: "Write a sentence that includes both words."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: computer – homework",
      input: "computer – homework",
      answer: "Sample: I used the computer to finish my homework.",
      explanation: "Write a sentence that includes both words."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: river – bridge",
      input: "river – bridge",
      answer: "Sample: The old bridge crosses the wide river.",
      explanation: "Write a sentence that includes both words."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: library – silence",
      input: "library – silence",
      answer: "Sample: There was complete silence in the library.",
      explanation: "Write a sentence that includes both words."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: ocean – sunset",
      input: "ocean – sunset",
      answer: "Sample: The sunset over the ocean was breathtaking.",
      explanation: "Write a sentence that includes both words."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: mountain – adventure",
      input: "mountain – adventure",
      answer: "Sample: Climbing the mountain was a great adventure.",
      explanation: "Write a sentence that includes both words."
    },
    {
      type: "use_given_words",
      difficulty: "creative",
      prompt: "Write one sentence using the following words: friendship – treasure",
      input: "friendship – treasure",
      answer: "Sample: True friendship is a precious treasure.",
      explanation: "Write a sentence that includes both words."
    }

  ];

  // State for tracking used exercises to avoid repetition
  const [usedExercises, setUsedExercises] = useState<Set<number>>(new Set());
  const [exerciseHistory, setExerciseHistory] = useState<Exercise[]>([]);
  const [shuffledExercises, setShuffledExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Fisher-Yates shuffle algorithm for better randomization
  const shuffleArray = useCallback((array: Exercise[]): Exercise[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Initialize shuffled exercises on component mount
  useEffect(() => {
    const shuffled = shuffleArray(predefinedExercises);
    setShuffledExercises(shuffled);
    setCurrentExerciseIndex(0);
    setUsedExercises(new Set());
    setExerciseHistory([]);
  }, []); // Empty dependency array - only run on mount

  // Get current exercise from shuffled array
  const getCurrentExercise = useCallback((): Exercise | null => {
    if (shuffledExercises.length === 0) return null;
    return shuffledExercises[currentExerciseIndex];
  }, [shuffledExercises, currentExerciseIndex]);

  // Move to next exercise
  const moveToNextExercise = useCallback(() => {
    setCurrentExerciseIndex(prev => {
      const nextIndex = prev + 1;
      // If we've reached the end, reshuffle and start over
      if (nextIndex >= shuffledExercises.length) {
        const newShuffled = shuffleArray(predefinedExercises);
        setShuffledExercises(newShuffled);
        toast({
          title: "🎉 All exercises completed!",
          description: "Reshuffling exercises for another round.",
        });
        return 0;
      }
      return nextIndex;
    });
  }, [shuffledExercises.length, shuffleArray]);

  // Force reshuffle function
  const reshuffleExercises = useCallback(() => {
    const newShuffled = shuffleArray(predefinedExercises);
    setShuffledExercises(newShuffled);
    setCurrentExerciseIndex(0);
    setUsedExercises(new Set());
    setExerciseHistory([]);
  }, [shuffleArray]);

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
          model: "gpt-4o",
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
          model: "gpt-4o",
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
    const currentExercise = getCurrentExercise();
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
      // For other types, use AI-powered grammar checking
      setIsValidating(true);
      
      try {
        // Use AI to check if the user's answer is grammatically correct
        const response = await fetch('/api/grammar/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanUserAnswer,
            mode: 'minimal',
            dialect: 'en-US',
            grade_level: 6
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const grammarScore = data.grammar_score || 0;
          
          // Check if answer is both correct and grammatically sound
          const isExactMatch = cleanUserAnswer.toLowerCase() === cleanCorrectAnswer.toLowerCase();
          const isGrammaticallyCorrect = grammarScore >= 80; // 80% threshold for grammar
          
          isCorrect = isExactMatch && isGrammaticallyCorrect;
          
          if (isExactMatch && !isGrammaticallyCorrect) {
            // Answer is correct but has grammar issues
            isCorrect = false;
            setFeedback(`Your answer is correct, but there are grammar issues: ${data.corrected || cleanUserAnswer}`);
          } else if (!isExactMatch && isGrammaticallyCorrect) {
            // Grammar is good but answer is wrong
            isCorrect = false;
            setFeedback(`Good grammar, but the correct answer is: "${currentExercise.answer}"`);
          } else if (!isExactMatch && !isGrammaticallyCorrect) {
            // Both wrong - provide comprehensive feedback
            isCorrect = false;
            let comprehensiveFeedback = `Not quite right. The correct answer is: "${currentExercise.answer}".`;
            
            // Add specific grammar feedback if available
            if (data.corrected && data.corrected !== cleanUserAnswer) {
              comprehensiveFeedback += ` Also, there are grammar issues: ${data.corrected}`;
            }
            
            // Add specific error analysis
            if (data.tags && data.tags.length > 0) {
              const errorTypes = data.tags.map(tag => tag.toLowerCase()).join(', ');
              comprehensiveFeedback += ` Grammar errors found: ${errorTypes}.`;
            }
            
            setFeedback(comprehensiveFeedback);
          }
        } else {
          // Fallback to simple matching if AI fails
          isCorrect = cleanUserAnswer.toLowerCase() === cleanCorrectAnswer.toLowerCase();
        }
      } catch (error) {
        console.error('AI validation failed:', error);
        // Fallback to simple matching
        isCorrect = cleanUserAnswer.toLowerCase() === cleanCorrectAnswer.toLowerCase();
      }
      
      setIsValidating(false);
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
          description: feedback || `The correct answer is: "${currentExercise.answer}"`,
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
      await updateProgress("grammar_exercises", {
        total_attempts: 1,
        correct_answers: isCorrect ? 1 : 0,
        total_time_spent: Math.max(1, sessionTime), // Keep in seconds
        best_streak: isCorrect ? 1 : 0
      });

      await addSession({
        user_id: '', // Will be filled by the hook
        activity_type: 'grammar_exercises',
        score: isCorrect ? 1 : 0,
        total_questions: 1,
        time_spent: Math.max(1, sessionTime), // Keep in seconds
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
  }, [userAnswer, stats, playSound, updateProgress, addSession, sessionTime, feedback, shuffledExercises, currentExerciseIndex]);

  const nextExercise = useCallback(() => {
    moveToNextExercise();
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setFeedback("");
    playSound("click");
  }, [moveToNextExercise, playSound]);

  const retryExercise = () => {
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setShowCorrectAnswer(false);
    setFeedback("");
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
    // Component is ready, no need to call nextExercise here
    // The current exercise is already set from the shuffled array
  }, []);

  const currentExercise = getCurrentExercise();

  if (!currentExercise) {
    return <div>Loading exercise...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-green-600 mb-3">📝 Grammar Exercise</h3>
        <p className="text-base text-gray-600 mb-4">Practice your grammar skills with dynamic exercises!</p>
        <div className="flex justify-between text-base text-gray-600">
          <span>Score: {stats.score}/{stats.totalAttempts}</span>
          <span>Accuracy: {stats.accuracy}%</span>
          <span>Session: {getFormattedTime()}</span>
        </div>
      </div>

      {/* Exercise Display */}
      <div className="mb-8">
        <div className="bg-green-50 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-800 text-lg">Question:</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentExercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
              currentExercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
              currentExercise.difficulty === 'advanced' ? 'bg-red-100 text-red-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {currentExercise.difficulty.charAt(0).toUpperCase() + currentExercise.difficulty.slice(1)}
            </span>
          </div>
          <p className="text-xl text-green-700">{currentExercise.prompt}</p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 text-lg">Input:</h4>
          <p className="text-xl text-gray-700 font-mono">{currentExercise.input}</p>
        </div>
      </div>

      {/* Answer Input */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
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
            className="flex-1 p-4 border border-gray-300 rounded-lg text-xl focus:ring-2 focus:ring-green-400 focus:border-transparent"
            disabled={showResult}
          />

          {isSupported && (
            <button
              onClick={startListening}
              disabled={showResult}
              className={`p-4 rounded-lg text-white ${
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
          <div className="text-center text-base text-blue-600 mb-4">
            🎤 Listening... Speak your answer clearly
          </div>
        )}
      </div>

      {/* Result Display */}
      {showResult && (
        <div className={`text-center p-6 rounded-lg mb-6 ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            {isValidating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-lg">Validating...</span>
              </div>
            ) : isCorrect ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <span className="text-2xl">❌</span>
            )}
            <span className="font-semibold text-lg">
              {isValidating ? "Validating..." : isCorrect ? "Correct!" : "Not quite right"}
            </span>
          </div>
          {!isValidating && (
            <p className="text-base mt-3">
              {feedback || currentExercise.explanation || "Please try again."}
            </p>
          )}
          {!isCorrect && !isValidating && (
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={retryExercise}
                className="bg-blue-500 text-white px-4 py-2 rounded text-base hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={showAnswer}
                className="bg-gray-500 text-white px-4 py-2 rounded text-base hover:bg-gray-600"
              >
                Show Answer
              </button>
            </div>
          )}
          {showCorrectAnswer && (
            <div className="mt-4 p-3 bg-yellow-100 rounded">
              <p className="text-base font-semibold">Correct Answer:</p>
              <p className="text-base">{currentExercise.answer}</p>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={checkAnswer}
          disabled={!userAnswer.trim() || showResult || isValidating}
          className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Validating...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Check Answer
            </>
          )}
        </button>
        
        <button
          onClick={nextExercise}
          className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-lg"
        >
          <Shuffle className="h-5 w-5" />
          Next Exercise
        </button>

        <button
          onClick={() => {
            // Force shuffle by resetting and reshuffling all exercises
            reshuffleExercises();
            setUserAnswer("");
            setShowResult(false);
            setIsCorrect(false);
            setFeedback("");
            playSound("click");
          }}
          className="bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 flex items-center justify-center gap-1 text-lg"
          title="Shuffle all exercises"
        >
          <Shuffle className="h-5 w-5" />
          <span>Shuffle</span>
        </button>
      </div>
    </div>
  );
};

export default ExerciseGenerator;
