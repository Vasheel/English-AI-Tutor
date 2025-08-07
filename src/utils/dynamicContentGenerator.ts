import { VocabWord, GrammarQuestion } from '@/components/psacVocabulary';

// Extended vocabulary with more diverse content
const extendedVocabulary: VocabWord[] = [
  // Original PSAC vocabulary
  { word: "HERITAGE", hint: "Passed down from ancestors", topic: "Culture" },
  { word: "FAINTED", hint: "Lost consciousness suddenly", topic: "Story Writing" },
  { word: "SAPSIPWAY", hint: "Traditional Mauritian game", topic: "Traditional Games" },
  { word: "COMPOSER", hint: "Someone who writes music", topic: "Music" },
  { word: "PENDANT", hint: "An ornament that hangs on a chain", topic: "Adventure Story" },
  { word: "GIGGLE", hint: "To laugh in a silly way", topic: "Feelings" },
  { word: "GRABBED", hint: "Took quickly or roughly", topic: "Action Verbs" },
  { word: "QUIETLY", hint: "In a silent way", topic: "Adverbs" },
  
  // Additional vocabulary for variety
  { word: "MYSTERIOUS", hint: "Difficult to explain or understand", topic: "Mystery" },
  { word: "ADVENTURE", hint: "An exciting journey or experience", topic: "Adventure" },
  { word: "BEAUTIFUL", hint: "Pleasant to look at", topic: "Descriptions" },
  { word: "CAREFULLY", hint: "With great attention", topic: "Adverbs" },
  { word: "EXCITED", hint: "Very happy and enthusiastic", topic: "Feelings" },
  { word: "FRIENDLY", hint: "Kind and helpful", topic: "Personality" },
  { word: "GENEROUS", hint: "Willing to give or share", topic: "Character" },
  { word: "HAPPINESS", hint: "The feeling of being happy", topic: "Emotions" },
  { word: "IMPORTANT", hint: "Having great significance", topic: "Descriptions" },
  { word: "JOURNEY", hint: "A trip from one place to another", topic: "Travel" },
  { word: "KNOWLEDGE", hint: "Information and understanding", topic: "Education" },
  { word: "LANGUAGE", hint: "A system of communication", topic: "Communication" },
  { word: "MAGNIFICENT", hint: "Very impressive and beautiful", topic: "Descriptions" },
  { word: "NATURALLY", hint: "In a way that is normal", topic: "Adverbs" },
  { word: "OPPORTUNITY", hint: "A chance to do something", topic: "Life" },
  { word: "PERFECTLY", hint: "In a way that is exactly right", topic: "Adverbs" },
  { word: "QUESTION", hint: "A sentence that asks something", topic: "Communication" },
  { word: "REMEMBER", hint: "To keep in mind", topic: "Memory" },
  { word: "SURPRISED", hint: "Feeling unexpected amazement", topic: "Emotions" },
  { word: "TOGETHER", hint: "With each other", topic: "Relationships" },
  { word: "UNDERSTAND", hint: "To know the meaning of", topic: "Learning" },
  { word: "VALUABLE", hint: "Worth a lot of money or importance", topic: "Descriptions" },
  { word: "WONDERFUL", hint: "Extremely good or pleasant", topic: "Descriptions" },
  { word: "EXCELLENT", hint: "Very good or outstanding", topic: "Descriptions" },
  { word: "FANTASTIC", hint: "Extraordinarily good", topic: "Descriptions" },
  { word: "GENTLEMAN", hint: "A polite and well-mannered man", topic: "Character" },
  { word: "HOSPITAL", hint: "A place where sick people are treated", topic: "Health" },
  { word: "INCREDIBLE", hint: "Difficult to believe", topic: "Descriptions" },
  { word: "JUBILANT", hint: "Feeling great happiness", topic: "Emotions" },
  { word: "KINDNESS", hint: "The quality of being kind", topic: "Character" },
  { word: "LEARNING", hint: "The process of gaining knowledge", topic: "Education" },
  { word: "MAGICAL", hint: "Relating to magic or enchantment", topic: "Fantasy" },
  { word: "NATURAL", hint: "Existing in nature", topic: "Environment" },
  { word: "ORCHESTRA", hint: "A large group of musicians", topic: "Music" },
  { word: "PEACEFUL", hint: "Calm and quiet", topic: "Descriptions" },
  { word: "QUALITY", hint: "The standard of something", topic: "Descriptions" },
  { word: "RESPECT", hint: "A feeling of admiration", topic: "Character" },
  { word: "SUNSHINE", hint: "Light from the sun", topic: "Nature" },
  { word: "TREASURE", hint: "Valuable collection of things", topic: "Adventure" },
  { word: "UNIVERSAL", hint: "Relating to everyone", topic: "Descriptions" },
  { word: "VICTORY", hint: "Success in a competition", topic: "Achievement" },
  { word: "WISDOM", hint: "Knowledge and good judgment", topic: "Character" },
  { word: "YOUTHFUL", hint: "Having qualities of young people", topic: "Descriptions" },
  { word: "ZEALOUS", hint: "Very enthusiastic", topic: "Character" }
];

// Grammar question templates for dynamic generation
const grammarTemplates = {
  "Culture": [
    {
      question: "What is a heritage site?",
      options: ["A new building", "A place of historical importance", "A shopping center", "A modern office"],
      answer: "A place of historical importance"
    },
    {
      question: "Which word describes something passed down from ancestors?",
      options: ["Modern", "Heritage", "Temporary", "New"],
      answer: "Heritage"
    }
  ],
  "Story Writing": [
    {
      question: "What tense is used in 'She fainted suddenly'?",
      options: ["Present", "Past", "Future", "Present perfect"],
      answer: "Past"
    },
    {
      question: "Which word means 'lost consciousness'?",
      options: ["Fainted", "Slept", "Woke", "Dreamed"],
      answer: "Fainted"
    }
  ],
  "Traditional Games": [
    {
      question: "What is a sapsiway made from?",
      options: ["Paper", "Elastic bands", "Plastic bottle", "Wood"],
      answer: "Elastic bands"
    },
    {
      question: "Which is a traditional Mauritian game?",
      options: ["Sapsiway", "Football", "Basketball", "Tennis"],
      answer: "Sapsiway"
    }
  ],
  "Music": [
    {
      question: "What does a composer do?",
      options: ["Write books", "Make music", "Paint pictures", "Build houses"],
      answer: "Make music"
    },
    {
      question: "Who writes the music for songs?",
      options: ["A painter", "A composer", "A writer", "A dancer"],
      answer: "A composer"
    }
  ],
  "Adventure Story": [
    {
      question: "Where is a pendant usually worn?",
      options: ["On the finger", "Around the neck", "On the wrist", "In the hair"],
      answer: "Around the neck"
    },
    {
      question: "What is a pendant?",
      options: ["A type of shoe", "A necklace ornament", "A hat", "A bag"],
      answer: "A necklace ornament"
    }
  ],
  "Feelings": [
    {
      question: "What does 'giggle' mean?",
      options: ["Shout loudly", "Laugh quietly", "Cry silently", "Speak softly"],
      answer: "Laugh quietly"
    },
    {
      question: "Which word means to laugh in a silly way?",
      options: ["Cry", "Giggle", "Shout", "Whisper"],
      answer: "Giggle"
    }
  ],
  "Action Verbs": [
    {
      question: "Which word means the same as 'grabbed'?",
      options: ["Dropped", "Snatched", "Pushed", "Pulled"],
      answer: "Snatched"
    },
    {
      question: "What does 'grabbed' mean?",
      options: ["Took slowly", "Took quickly", "Dropped", "Pushed"],
      answer: "Took quickly"
    }
  ],
  "Adverbs": [
    {
      question: "Which sentence uses 'quietly' correctly?",
      options: [
        "He quietly slammed the door.",
        "She shouted quietly.",
        "They danced quietly music.",
        "The music played quietly loudly."
      ],
      answer: "He quietly slammed the door."
    },
    {
      question: "What does 'quietly' mean?",
      options: ["Loudly", "In a silent way", "Quickly", "Slowly"],
      answer: "In a silent way"
    }
  ],
  "Mystery": [
    {
      question: "What does 'mysterious' mean?",
      options: ["Easy to understand", "Difficult to explain", "Very clear", "Very simple"],
      answer: "Difficult to explain"
    },
    {
      question: "Which word describes something hard to explain?",
      options: ["Clear", "Simple", "Mysterious", "Obvious"],
      answer: "Mysterious"
    }
  ],
  "Adventure": [
    {
      question: "What is an adventure?",
      options: ["A boring day", "An exciting journey", "A regular task", "A simple walk"],
      answer: "An exciting journey"
    },
    {
      question: "Which word means an exciting experience?",
      options: ["Routine", "Adventure", "Boredom", "Rest"],
      answer: "Adventure"
    }
  ],
  "Descriptions": [
    {
      question: "What does 'beautiful' mean?",
      options: ["Ugly", "Pleasant to look at", "Scary", "Strange"],
      answer: "Pleasant to look at"
    },
    {
      question: "Which word means very good or outstanding?",
      options: ["Bad", "Excellent", "Poor", "Terrible"],
      answer: "Excellent"
    }
  ],
  "Personality": [
    {
      question: "What does 'friendly' mean?",
      options: ["Mean", "Kind and helpful", "Shy", "Angry"],
      answer: "Kind and helpful"
    },
    {
      question: "Which word describes someone who is kind?",
      options: ["Friendly", "Mean", "Angry", "Sad"],
      answer: "Friendly"
    }
  ],
  "Character": [
    {
      question: "What does 'generous' mean?",
      options: ["Selfish", "Willing to give", "Mean", "Greedy"],
      answer: "Willing to give"
    },
    {
      question: "Which word means the quality of being kind?",
      options: ["Meanness", "Kindness", "Anger", "Sadness"],
      answer: "Kindness"
    }
  ],
  "Emotions": [
    {
      question: "What is happiness?",
      options: ["A feeling of sadness", "A feeling of being happy", "A feeling of anger", "A feeling of fear"],
      answer: "A feeling of being happy"
    },
    {
      question: "Which word means feeling great happiness?",
      options: ["Sad", "Jubilant", "Angry", "Scared"],
      answer: "Jubilant"
    }
  ],
  "Travel": [
    {
      question: "What is a journey?",
      options: ["A trip from one place to another", "A short walk", "A rest", "A sleep"],
      answer: "A trip from one place to another"
    },
    {
      question: "Which word means a trip?",
      options: ["Rest", "Journey", "Sleep", "Stop"],
      answer: "Journey"
    }
  ],
  "Education": [
    {
      question: "What is knowledge?",
      options: ["Ignorance", "Information and understanding", "Confusion", "Doubt"],
      answer: "Information and understanding"
    },
    {
      question: "What is the process of gaining knowledge called?",
      options: ["Forgetting", "Learning", "Ignoring", "Sleeping"],
      answer: "Learning"
    }
  ],
  "Communication": [
    {
      question: "What is language?",
      options: ["A type of food", "A system of communication", "A type of music", "A type of dance"],
      answer: "A system of communication"
    },
    {
      question: "What is a question?",
      options: ["A statement", "A sentence that asks something", "A command", "A request"],
      answer: "A sentence that asks something"
    }
  ],
  "Memory": [
    {
      question: "What does 'remember' mean?",
      options: ["To forget", "To keep in mind", "To ignore", "To lose"],
      answer: "To keep in mind"
    },
    {
      question: "Which word means to keep in mind?",
      options: ["Forget", "Remember", "Ignore", "Lose"],
      answer: "Remember"
    }
  ],
  "Relationships": [
    {
      question: "What does 'together' mean?",
      options: ["Alone", "With each other", "Apart", "Separate"],
      answer: "With each other"
    },
    {
      question: "Which word means with each other?",
      options: ["Alone", "Together", "Apart", "Separate"],
      answer: "Together"
    }
  ],
  "Learning": [
    {
      question: "What does 'understand' mean?",
      options: ["To know the meaning of", "To forget", "To ignore", "To lose"],
      answer: "To know the meaning of"
    },
    {
      question: "Which word means to know the meaning of?",
      options: ["Forget", "Understand", "Ignore", "Lose"],
      answer: "Understand"
    }
  ],
  "Health": [
    {
      question: "What is a hospital?",
      options: ["A school", "A place where sick people are treated", "A restaurant", "A shop"],
      answer: "A place where sick people are treated"
    },
    {
      question: "Where do sick people go for treatment?",
      options: ["School", "Hospital", "Restaurant", "Shop"],
      answer: "Hospital"
    }
  ],
  "Fantasy": [
    {
      question: "What does 'magical' mean?",
      options: ["Normal", "Relating to magic", "Boring", "Realistic"],
      answer: "Relating to magic"
    },
    {
      question: "Which word means relating to magic?",
      options: ["Normal", "Magical", "Boring", "Realistic"],
      answer: "Magical"
    }
  ],
  "Environment": [
    {
      question: "What does 'natural' mean?",
      options: ["Man-made", "Existing in nature", "Artificial", "Fake"],
      answer: "Existing in nature"
    },
    {
      question: "Which word means existing in nature?",
      options: ["Artificial", "Natural", "Fake", "Man-made"],
      answer: "Natural"
    }
  ],
  "Music": [
    {
      question: "What is an orchestra?",
      options: ["A sports team", "A large group of musicians", "A school", "A hospital"],
      answer: "A large group of musicians"
    },
    {
      question: "Which is a large group of musicians?",
      options: ["Orchestra", "Team", "Class", "Group"],
      answer: "Orchestra"
    }
  ],
  "Nature": [
    {
      question: "What is sunshine?",
      options: ["Light from the moon", "Light from the sun", "Light from a lamp", "Light from a fire"],
      answer: "Light from the sun"
    },
    {
      question: "Which word means light from the sun?",
      options: ["Moonlight", "Sunshine", "Starlight", "Firelight"],
      answer: "Sunshine"
    }
  ],
  "Achievement": [
    {
      question: "What is victory?",
      options: ["Loss", "Success in a competition", "Tie", "Draw"],
      answer: "Success in a competition"
    },
    {
      question: "Which word means success in a competition?",
      options: ["Loss", "Victory", "Tie", "Draw"],
      answer: "Victory"
    }
  ]
};

// Track used words to avoid repetition
let usedWords: Set<string> = new Set();
let usedQuestions: Set<string> = new Set();

// Reset used content (call this periodically or when starting a new session)
export const resetUsedContent = () => {
  usedWords.clear();
  usedQuestions.clear();
};

// Get a random word that hasn't been used recently
export const getRandomWord = (): VocabWord => {
  const availableWords = extendedVocabulary.filter(word => !usedWords.has(word.word));
  
  // If all words have been used, reset and start over
  if (availableWords.length === 0) {
    usedWords.clear();
    return getRandomWord();
  }
  
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  const selectedWord = availableWords[randomIndex];
  
  // Mark as used
  usedWords.add(selectedWord.word);
  
  return selectedWord;
};

// Get a random grammar question that hasn't been used recently
export const getRandomGrammarQuestion = (wordObj: VocabWord): GrammarQuestion => {
  const templates = grammarTemplates[wordObj.topic as keyof typeof grammarTemplates] || grammarTemplates["Descriptions"];
  
  const availableQuestions = templates.filter(q => !usedQuestions.has(q.question));
  
  // If all questions for this topic have been used, reset questions for this topic
  if (availableQuestions.length === 0) {
    // Remove only questions from this topic from used set
    templates.forEach(q => usedQuestions.delete(q.question));
    return getRandomGrammarQuestion(wordObj);
  }
  
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const selectedQuestion = availableQuestions[randomIndex];
  
  // Mark as used
  usedQuestions.add(selectedQuestion.question);
  
  return selectedQuestion;
};

// Generate a completely random word scramble
export const generateRandomWordScramble = (): VocabWord => {
  return getRandomWord();
};

// Generate a random quiz question based on difficulty
export const generateRandomQuizQuestion = (difficulty: number): GrammarQuestion => {
  const topics = Object.keys(grammarTemplates);
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const templates = grammarTemplates[randomTopic as keyof typeof grammarTemplates];
  
  const availableQuestions = templates.filter(q => !usedQuestions.has(q.question));
  
  if (availableQuestions.length === 0) {
    // Reset questions for this topic
    templates.forEach(q => usedQuestions.delete(q.question));
    return generateRandomQuizQuestion(difficulty);
  }
  
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const selectedQuestion = availableQuestions[randomIndex];
  
  usedQuestions.add(selectedQuestion.question);
  
  return selectedQuestion;
};

// Get multiple random words for variety
export const getMultipleRandomWords = (count: number): VocabWord[] => {
  const words: VocabWord[] = [];
  for (let i = 0; i < count; i++) {
    words.push(getRandomWord());
  }
  return words;
};

// Generate a sentence building exercise with random words
export const generateSentenceBuildingExercise = (): {
  words: string[];
  sentence: string;
  topic: string;
} => {
  const randomWords = getMultipleRandomWords(3);
  const words = randomWords.map(w => w.word.toLowerCase());
  
  // Create a simple sentence using the words
  const sentence = `The ${words[0]} is ${words[1]} and ${words[2]}.`;
  
  return {
    words,
    sentence,
    topic: "Sentence Building"
  };
};

// Get usage statistics
export const getUsageStats = () => {
  return {
    totalWords: extendedVocabulary.length,
    usedWords: usedWords.size,
    usedQuestions: usedQuestions.size,
    remainingWords: extendedVocabulary.length - usedWords.size
  };
}; 