export interface AIQuestionResult {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: number;
  topic: string;
}

export interface GenerateAIQuestionParams {
  difficulty: 1 | 2 | 3; // 1 = easy, 2 = medium, 3 = hard
  topic: 'tenses' | 'sentence structure' | 'punctuation' | 'parts of speech' | 'vocabulary' | 'grammar' | 'comprehension';
  maxRetries?: number;
}

// Topic-specific prompts for Grade 6 students
const topicPrompts = {
  'tenses': {
    easy: "Create a simple question about present simple tense for Grade 6 students. Focus on basic verb forms like 'go/goes', 'play/plays'.",
    medium: "Create a question about present continuous or past simple tense for Grade 6 students. Include common irregular verbs.",
    hard: "Create a question about perfect tenses (present perfect, past perfect) or future tenses for advanced Grade 6 students."
  },
  'sentence structure': {
    easy: "Create a question about basic sentence structure (subject + verb + object) for Grade 6 students.",
    medium: "Create a question about compound sentences or complex sentences for Grade 6 students.",
    hard: "Create a question about advanced sentence structures, clauses, or sentence types for advanced Grade 6 students."
  },
  'punctuation': {
    easy: "Create a question about basic punctuation (periods, commas, question marks) for Grade 6 students.",
    medium: "Create a question about quotation marks, apostrophes, or semicolons for Grade 6 students.",
    hard: "Create a question about advanced punctuation rules or complex punctuation scenarios for advanced Grade 6 students."
  },
  'parts of speech': {
    easy: "Create a question about basic parts of speech (nouns, verbs, adjectives) for Grade 6 students.",
    medium: "Create a question about adverbs, prepositions, or conjunctions for Grade 6 students.",
    hard: "Create a question about advanced parts of speech or word functions for advanced Grade 6 students."
  },
  'vocabulary': {
    easy: "Create a vocabulary question using simple, everyday words suitable for Grade 6 students.",
    medium: "Create a vocabulary question using intermediate words or context clues for Grade 6 students.",
    hard: "Create a vocabulary question using advanced words or complex word relationships for advanced Grade 6 students."
  },
  'grammar': {
    easy: "Create a basic grammar question about articles, plurals, or simple verb forms for Grade 6 students.",
    medium: "Create a grammar question about modals, conditionals, or passive voice for Grade 6 students.",
    hard: "Create an advanced grammar question about complex grammatical structures for advanced Grade 6 students."
  },
  'comprehension': {
    easy: "Create a reading comprehension question about main ideas or simple inferences for Grade 6 students.",
    medium: "Create a comprehension question about supporting details or author's purpose for Grade 6 students.",
    hard: "Create a comprehension question about complex analysis or critical thinking for advanced Grade 6 students."
  }
};

// Difficulty level descriptions
const difficultyDescriptions = {
  1: 'easy',
  2: 'medium', 
  3: 'hard'
};

// Age-appropriate content guidelines
const ageGuidelines = {
  vocabulary: "Use words that 11-12 year olds would encounter in their daily reading and schoolwork",
  examples: "Use examples from school, family, friends, hobbies, and everyday life",
  complexity: "Keep sentences clear and direct, avoid overly complex structures",
  topics: "Focus on topics relevant to Grade 6 students: school, sports, technology, animals, nature"
};

/**
 * Generate an AI-powered English question for Grade 6 students
 * @param params - Configuration parameters
 * @returns Promise<AIQuestionResult> - The generated question
 */
export const generateAIQuestion = async (params: GenerateAIQuestionParams): Promise<AIQuestionResult> => {
  const { difficulty, topic, maxRetries = 3 } = params;
  
  // Validate inputs
  if (![1, 2, 3].includes(difficulty)) {
    throw new Error('Difficulty must be 1, 2, or 3');
  }
  
  if (!topicPrompts[topic]) {
    throw new Error(`Invalid topic: ${topic}. Valid topics are: ${Object.keys(topicPrompts).join(', ')}`);
  }

  const difficultyDesc = difficultyDescriptions[difficulty];
  const topicPrompt = topicPrompts[topic][difficultyDesc];

  const systemPrompt = `You are an expert English teacher for Grade 6 students (ages 11-12). 
Create engaging, age-appropriate questions that help students learn English effectively.

Guidelines:
- Use clear, simple language appropriate for 11-12 year olds
- Include examples from school, family, friends, and everyday life
- Make questions engaging and relevant to students' experiences
- Provide clear, educational explanations
- Ensure all content is suitable for Grade 6 students

Always respond with valid JSON only.`;

  const userPrompt = `${topicPrompt}

${ageGuidelines.vocabulary}
${ageGuidelines.examples}
${ageGuidelines.complexity}
${ageGuidelines.topics}

Generate 1 multiple choice question in this exact JSON format:
{
  "question": "The question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The correct option (A, B, C, or D)",
  "explanation": "Brief explanation of why this is correct",
  "difficulty": ${difficulty},
  "topic": "${topic}"
}

Make sure the question is:
- Age-appropriate for Grade 6 students (11-12 years old)
- Engaging and relevant to their experiences
- Clear and easy to understand
- Educational and helpful for learning

The response must be valid JSON.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Generating AI question (attempt ${attempt}/${maxRetries})...`);
      console.log(`📝 Topic: ${topic}, Difficulty: ${difficultyDesc}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      console.log('📄 Raw AI response:', content);

      // Try to parse the JSON response
      let questionData;
      try {
        questionData = JSON.parse(content);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Invalid JSON response from AI');
      }

      // Validate the question structure
      if (!questionData.question || !questionData.options || !questionData.correctAnswer) {
        throw new Error('Invalid question structure - missing required fields');
      }

      if (!Array.isArray(questionData.options) || questionData.options.length !== 4) {
        throw new Error('Invalid options - must be an array of exactly 4 options');
      }

      // Validate that correctAnswer matches one of the options
      const validAnswers = ['A', 'B', 'C', 'D'];
      if (!validAnswers.includes(questionData.correctAnswer)) {
        throw new Error('Invalid correctAnswer - must be A, B, C, or D');
      }

      // Create the result object
      const result: AIQuestionResult = {
        question: questionData.question,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation,
        difficulty,
        topic
      };

      console.log('✅ AI question generated successfully:', result);
      return result;

    } catch (error) {
      console.error(`❌ AI question generation attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Return a fallback question if all attempts fail
        console.log('🔄 Using fallback question due to AI failure');
        return generateFallbackQuestion(difficulty, topic);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // This should never be reached, but just in case
  throw new Error('Failed to generate AI question after all retries');
};

/**
 * Generate a fallback question when AI fails
 */
const generateFallbackQuestion = (difficulty: number, topic: string): AIQuestionResult => {
  const fallbackQuestions = {
    'tenses': {
      1: {
        question: "Choose the correct form: 'She _____ to school every day.'",
        options: ['go', 'goes', 'going', 'gone'],
        correctAnswer: 'B',
        explanation: 'We use "goes" for third person singular in present simple tense.'
      },
      2: {
        question: "Which sentence uses the past continuous tense?",
        options: ['I went to school.', 'I was going to school.', 'I have gone to school.', 'I will go to school.'],
        correctAnswer: 'B',
        explanation: 'Past continuous uses "was/were + verb-ing" to show ongoing past actions.'
      },
      3: {
        question: "Complete: 'By the time I arrived, she _____ already left.'",
        options: ['has', 'had', 'have', 'having'],
        correctAnswer: 'B',
        explanation: 'Past perfect uses "had + past participle" for actions completed before another past action.'
      }
    },
    'sentence structure': {
      1: {
        question: "Which is a complete sentence?",
        options: ['Running fast.', 'The dog runs fast.', 'In the park.', 'Very quickly.'],
        correctAnswer: 'B',
        explanation: 'A complete sentence needs a subject and a verb.'
      },
      2: {
        question: "Identify the compound sentence:",
        options: ['I like pizza.', 'I like pizza and pasta.', 'I like pizza, and my friend likes pasta.', 'Pizza is delicious.'],
        correctAnswer: 'C',
        explanation: 'A compound sentence joins two independent clauses with a conjunction.'
      },
      3: {
        question: "Which sentence has a dependent clause?",
        options: ['I went to the store.', 'When I arrived, the store was closed.', 'The store sells books.', 'I bought a book.'],
        correctAnswer: 'B',
        explanation: 'A dependent clause cannot stand alone and starts with words like "when", "if", "because".'
      }
    },
    'punctuation': {
      1: {
        question: "Which sentence has correct punctuation?",
        options: ['I like pizza.', 'I like pizza', 'I like pizza!', 'I like pizza?'],
        correctAnswer: 'A',
        explanation: 'A declarative sentence ends with a period.'
      },
      2: {
        question: "Choose the correctly punctuated sentence:",
        options: ['"Hello," said Tom.', '"Hello" said Tom.', '"Hello," said Tom', '"Hello" said Tom'],
        correctAnswer: 'A',
        explanation: 'Commas go inside quotation marks when they separate the quote from the rest of the sentence.'
      },
      3: {
        question: "Which sentence uses semicolons correctly?",
        options: ['I have three pets; a dog, a cat, and a bird.', 'I have three pets: a dog, a cat, and a bird.', 'I have three pets, a dog, a cat, and a bird.', 'I have three pets. A dog, a cat, and a bird.'],
        correctAnswer: 'A',
        explanation: 'Semicolons can separate items in a list when the items contain commas.'
      }
    },
    'parts of speech': {
      1: {
        question: "Which word is a noun?",
        options: ['run', 'quickly', 'happy', 'school'],
        correctAnswer: 'D',
        explanation: 'A noun is a person, place, thing, or idea.'
      },
      2: {
        question: "Identify the adverb in: 'She runs quickly.'",
        options: ['She', 'runs', 'quickly', 'none'],
        correctAnswer: 'C',
        explanation: 'An adverb describes how, when, where, or to what extent an action happens.'
      },
      3: {
        question: "Which word is a conjunction?",
        options: ['happy', 'quickly', 'and', 'school'],
        correctAnswer: 'C',
        explanation: 'A conjunction connects words, phrases, or clauses.'
      }
    },
    'vocabulary': {
      1: {
        question: "What is a synonym for 'happy'?",
        options: ['sad', 'joyful', 'angry', 'tired'],
        correctAnswer: 'B',
        explanation: 'A synonym is a word with the same or similar meaning.'
      },
      2: {
        question: "What does 'generous' mean?",
        options: ['selfish', 'willing to give', 'angry', 'sad'],
        correctAnswer: 'B',
        explanation: 'Generous means willing to give or share with others.'
      },
      3: {
        question: "Which word means 'difficult to understand'?",
        options: ['simple', 'clear', 'mysterious', 'obvious'],
        correctAnswer: 'C',
        explanation: 'Mysterious means difficult to explain or understand.'
      }
    },
    'grammar': {
      1: {
        question: "Choose the correct article: 'I saw _____ elephant.'",
        options: ['a', 'an', 'the', 'none'],
        correctAnswer: 'B',
        explanation: 'Use "an" before words that begin with vowel sounds.'
      },
      2: {
        question: "Which sentence uses the correct verb form?",
        options: ['She don\'t like apples.', 'She doesn\'t like apples.', 'She not like apples.', 'She no like apples.'],
        correctAnswer: 'B',
        explanation: 'Use "doesn\'t" for third person singular negative in present simple.'
      },
      3: {
        question: "Identify the passive voice:",
        options: ['I wrote the letter.', 'The letter was written by me.', 'I am writing the letter.', 'I will write the letter.'],
        correctAnswer: 'B',
        explanation: 'Passive voice focuses on the action, not who performed it.'
      }
    },
    'comprehension': {
      1: {
        question: "What is the main idea of a story?",
        options: ['The first sentence', 'The most important point', 'The last sentence', 'The longest paragraph'],
        correctAnswer: 'B',
        explanation: 'The main idea is the most important point the author wants to convey.'
      },
      2: {
        question: "What is an inference?",
        options: ['A direct statement', 'A conclusion based on evidence', 'A question', 'A fact'],
        correctAnswer: 'B',
        explanation: 'An inference is a conclusion drawn from evidence and reasoning.'
      },
      3: {
        question: "What is the author's purpose in a persuasive text?",
        options: ['To entertain', 'To inform', 'To convince', 'To describe'],
        correctAnswer: 'C',
        explanation: 'Persuasive texts aim to convince the reader of a particular viewpoint.'
      }
    }
  };

  const topicQuestions = fallbackQuestions[topic as keyof typeof fallbackQuestions];
  if (!topicQuestions) {
    // Default fallback if topic not found
    return {
      question: "Choose the correct answer: 'She _____ to school.'",
      options: ['go', 'goes', 'going', 'gone'],
      correctAnswer: 'B',
      explanation: 'Use "goes" for third person singular in present simple tense.',
      difficulty,
      topic
    };
  }

  const question = topicQuestions[difficulty as keyof typeof topicQuestions];
  if (!question) {
    // Use easy question as default
    return {
      ...topicQuestions[1],
      difficulty,
      topic
    };
  }

  return {
    ...question,
    difficulty,
    topic
  };
};

/**
 * Generate multiple AI questions at once
 */
export const generateMultipleAIQuestions = async (
  params: GenerateAIQuestionParams & { count: number }
): Promise<AIQuestionResult[]> => {
  const { count, ...questionParams } = params;
  const questions: AIQuestionResult[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const question = await generateAIQuestion(questionParams);
      questions.push(question);
    } catch (error) {
      console.error(`Failed to generate question ${i + 1}:`, error);
      // Add fallback question
      questions.push(generateFallbackQuestion(questionParams.difficulty, questionParams.topic));
    }
  }

  return questions;
};

/**
 * Test the AI question generator
 */
export const testAIQuestionGenerator = async () => {
  console.log('🧪 Testing AI Question Generator...');
  
  const testCases = [
    { difficulty: 1, topic: 'tenses' as const },
    { difficulty: 2, topic: 'vocabulary' as const },
    { difficulty: 3, topic: 'grammar' as const }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📝 Testing: ${testCase.topic} (Difficulty ${testCase.difficulty})`);
      const question = await generateAIQuestion(testCase);
      console.log('✅ Success:', question);
    } catch (error) {
      console.error('❌ Failed:', error);
    }
  }
}; 