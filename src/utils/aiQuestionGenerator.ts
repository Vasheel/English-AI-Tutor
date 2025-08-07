import { VocabWord, GrammarQuestion } from '@/components/psacVocabulary';

export interface AIQuestion {
  id: string;
  type: 'multiple-choice' | 'cloze';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'grammar' | 'vocabulary' | 'comprehension';
}

export interface AIWordScrambleQuestion {
  word: string;
  hint: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Cache for AI-generated questions to avoid repeated API calls
const questionCache = new Map<string, AIQuestion[]>();
const wordCache = new Map<string, AIWordScrambleQuestion[]>();

// Generate AI questions with retry logic
export const generateAIQuestions = async (
  difficulty: 'easy' | 'medium' | 'hard',
  category: 'grammar' | 'vocabulary' | 'comprehension',
  count: number = 3,
  maxRetries: number = 3
): Promise<AIQuestion[]> => {
  const cacheKey = `${difficulty}-${category}-${count}`;
  
  // Check cache first
  if (questionCache.has(cacheKey)) {
    const cached = questionCache.get(cacheKey)!;
    if (cached.length >= count) {
      return cached.slice(0, count);
    }
  }

  const difficultyPrompts = {
    easy: "Create easy English questions suitable for 6th grade students. Focus on basic grammar rules, simple vocabulary, and fundamental concepts.",
    medium: "Create medium-difficulty English questions suitable for 6th grade students. Include intermediate grammar concepts, vocabulary building, and reading comprehension.",
    hard: "Create challenging English questions suitable for advanced 6th grade students. Include complex grammar concepts, advanced vocabulary, and critical thinking."
  };

  const categoryPrompts = {
    grammar: "Focus on grammar rules, sentence structure, parts of speech, verb tenses, and punctuation.",
    vocabulary: "Focus on word meanings, synonyms, antonyms, context clues, and vocabulary building.",
    comprehension: "Focus on reading comprehension, understanding main ideas, making inferences, and text analysis."
  };

  const prompt = `${difficultyPrompts[difficulty]} ${categoryPrompts[category]}

Generate ${count} multiple choice questions in this exact JSON format:
[
  {
    "id": "ai-mcq-1",
    "type": "multiple-choice",
    "question": "The question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct option (A, B, C, or D)",
    "explanation": "Brief explanation of why this is correct",
    "difficulty": "${difficulty}",
    "category": "${category}"
  }
]

Make sure each question is unique and engaging. The response must be valid JSON.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an English education expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      // Parse the JSON response
      const questions = JSON.parse(content);
      
      // Validate the questions structure
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Validate each question
      const validQuestions = questions.filter(q => 
        q.question && q.options && q.correctAnswer && q.explanation && q.difficulty && q.category
      );

      if (validQuestions.length === 0) {
        throw new Error('No valid questions in response');
      }

      // Cache the questions
      questionCache.set(cacheKey, validQuestions);
      
      return validQuestions.slice(0, count);
    } catch (error) {
      console.error(`AI question generation attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Return fallback questions if AI fails
        return generateFallbackQuestions(difficulty, category, count);
      }
    }
  }

  return generateFallbackQuestions(difficulty, category, count);
};

// Generate AI word scramble questions
export const generateAIWordScramble = async (
  difficulty: 'easy' | 'medium' | 'hard',
  maxRetries: number = 3
): Promise<AIWordScrambleQuestion> => {
  const cacheKey = `word-${difficulty}`;
  
  // Check cache first
  if (wordCache.has(cacheKey)) {
    const cached = wordCache.get(cacheKey)!;
    if (cached.length > 0) {
      const word = cached.shift()!;
      // Put it back at the end for rotation
      cached.push(word);
      return word;
    }
  }

  const difficultyPrompts = {
    easy: "Create easy English words suitable for 6th grade students. Use simple, common words with 4-6 letters.",
    medium: "Create medium-difficulty English words suitable for 6th grade students. Use intermediate vocabulary with 6-8 letters.",
    hard: "Create challenging English words suitable for advanced 6th grade students. Use advanced vocabulary with 8-12 letters."
  };

  const prompt = `${difficultyPrompts[difficulty]}

Generate 5 word scramble questions in this exact JSON format:
[
  {
    "word": "EXAMPLE",
    "hint": "A clear explanation of what this word means",
    "topic": "Category like Education, Nature, Technology, etc.",
    "difficulty": "${difficulty}"
  }
]

Make sure the words are appropriate for ${difficulty} difficulty level. The response must be valid JSON.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an English education expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      // Parse the JSON response
      const words = JSON.parse(content);
      
      // Validate the words structure
      if (!Array.isArray(words)) {
        throw new Error('Response is not an array');
      }

      // Validate each word
      const validWords = words.filter(w => 
        w.word && w.hint && w.topic && w.difficulty
      );

      if (validWords.length === 0) {
        throw new Error('No valid words in response');
      }

      // Cache the words
      wordCache.set(cacheKey, validWords);
      
      return validWords[0];
    } catch (error) {
      console.error(`AI word generation attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Return fallback word if AI fails
        return generateFallbackWord(difficulty);
      }
    }
  }

  return generateFallbackWord(difficulty);
};

// Fallback questions when AI fails
const generateFallbackQuestions = (
  difficulty: 'easy' | 'medium' | 'hard',
  category: 'grammar' | 'vocabulary' | 'comprehension',
  count: number
): AIQuestion[] => {
  const fallbackQuestions: AIQuestion[] = [
    {
      id: 'fallback-1',
      type: 'multiple-choice',
      question: "Choose the correct form of the verb: 'She _____ to school every day.'",
      options: ['go', 'goes', 'going', 'gone'],
      correctAnswer: 'goes',
      explanation: 'The correct answer is "goes" because it follows the third person singular rule in present simple tense.',
      difficulty: 'easy',
      category: 'grammar'
    },
    {
      id: 'fallback-2',
      type: 'multiple-choice',
      question: "Which word is a synonym for 'happy'?",
      options: ['sad', 'joyful', 'angry', 'tired'],
      correctAnswer: 'joyful',
      explanation: '"Joyful" is a synonym for "happy" as both words express positive emotions.',
      difficulty: 'easy',
      category: 'vocabulary'
    },
    {
      id: 'fallback-3',
      type: 'multiple-choice',
      question: "What is the main idea of a story?",
      options: ['The first sentence', 'The most important point', 'The last sentence', 'The longest paragraph'],
      correctAnswer: 'The most important point',
      explanation: 'The main idea is the most important point that the author wants to convey.',
      difficulty: 'easy',
      category: 'comprehension'
    }
  ];

  return fallbackQuestions.slice(0, count);
};

// Fallback word when AI fails
const generateFallbackWord = (difficulty: 'easy' | 'medium' | 'hard'): AIWordScrambleQuestion => {
  const fallbackWords = {
    easy: [
      { word: "HAPPY", hint: "Feeling good or pleased", topic: "Feelings", difficulty: 'easy' },
      { word: "BOOK", hint: "Something you read", topic: "Education", difficulty: 'easy' },
      { word: "TREE", hint: "A tall plant with leaves", topic: "Nature", difficulty: 'easy' }
    ],
    medium: [
      { word: "BEAUTIFUL", hint: "Pleasant to look at", topic: "Descriptions", difficulty: 'medium' },
      { word: "ADVENTURE", hint: "An exciting journey", topic: "Travel", difficulty: 'medium' },
      { word: "KNOWLEDGE", hint: "Information and understanding", topic: "Education", difficulty: 'medium' }
    ],
    hard: [
      { word: "MAGNIFICENT", hint: "Very impressive and beautiful", topic: "Descriptions", difficulty: 'hard' },
      { word: "OPPORTUNITY", hint: "A chance to do something", topic: "Life", difficulty: 'hard' },
      { word: "UNDERSTAND", hint: "To know the meaning of", topic: "Learning", difficulty: 'hard' }
    ]
  };

  const words = fallbackWords[difficulty];
  return words[Math.floor(Math.random() * words.length)];
};

// Clear cache (useful for testing or when you want fresh content)
export const clearAICache = () => {
  questionCache.clear();
  wordCache.clear();
};

// Get cache statistics
export const getAICacheStats = () => {
  return {
    questionCacheSize: questionCache.size,
    wordCacheSize: wordCache.size,
    totalCachedQuestions: Array.from(questionCache.values()).reduce((sum, questions) => sum + questions.length, 0),
    totalCachedWords: Array.from(wordCache.values()).reduce((sum, words) => sum + words.length, 0)
  };
}; 