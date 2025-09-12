// src/data/sentences.ts
export interface Sentence {
  id: string;
  words: string[];
  correct: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  grammar_focus?: string;
  hint?: string;
}

export const sentenceDatabase: Sentence[] = [
  // Beginner sentences
  {
    id: 'beginner-1',
    words: ["The", "cat", "is", "sleeping"],
    correct: "The cat is sleeping.",
    difficulty: 'beginner',
    category: 'animals',
    grammar_focus: 'present continuous',
    hint: "Start with 'The' and use 'is' before the action word ending in -ing"
  },
  {
    id: 'beginner-2',
    words: ["Birds", "fly", "in", "the", "sky"],
    correct: "Birds fly in the sky.",
    difficulty: 'beginner',
    category: 'nature',
    grammar_focus: 'present simple',
    hint: "Subject first, then the action, then the location with 'in the'"
  },
  {
    id: 'beginner-3',
    words: ["I", "like", "to", "read", "books"],
    correct: "I like to read books.",
    difficulty: 'beginner',
    category: 'hobbies',
    grammar_focus: 'like + infinitive',
    hint: "Use 'I like to' followed by the action and object"
  },
  {
    id: 'beginner-4',
    words: ["She", "plays", "with", "her", "dog"],
    correct: "She plays with her dog.",
    difficulty: 'beginner',
    category: 'animals',
    grammar_focus: 'present simple'
  },
  {
    id: 'beginner-5',
    words: ["We", "go", "to", "school", "every", "day"],
    correct: "We go to school every day.",
    difficulty: 'beginner',
    category: 'daily_routine',
    grammar_focus: 'present simple + frequency'
  },
  {
    id: 'beginner-6',
    words: ["The", "sun", "is", "shining", "brightly"],
    correct: "The sun is shining brightly.",
    difficulty: 'beginner',
    category: 'weather',
    grammar_focus: 'present continuous'
  },
  {
    id: 'beginner-7',
    words: ["My", "mother", "cooks", "delicious", "food"],
    correct: "My mother cooks delicious food.",
    difficulty: 'beginner',
    category: 'family',
    grammar_focus: 'present simple'
  },
  {
    id: 'beginner-8',
    words: ["The", "children", "are", "playing", "outside"],
    correct: "The children are playing outside.",
    difficulty: 'beginner',
    category: 'activities',
    grammar_focus: 'present continuous'
  },

  // Intermediate sentences
  {
    id: 'intermediate-1',
    words: ["Although", "it", "was", "raining", "he", "went", "for", "a", "walk"],
    correct: "Although it was raining, he went for a walk.",
    difficulty: 'intermediate',
    category: 'weather',
    grammar_focus: 'conjunctions',
    hint: "Start with 'Although' to show contrast, then add a comma before the main clause"
  },
  {
    id: 'intermediate-2',
    words: ["The", "book", "that", "I", "read", "yesterday", "was", "very", "interesting"],
    correct: "The book that I read yesterday was very interesting.",
    difficulty: 'intermediate',
    category: 'hobbies',
    grammar_focus: 'relative clauses'
  },
  {
    id: 'intermediate-3',
    words: ["If", "you", "study", "hard", "you", "will", "pass", "the", "exam"],
    correct: "If you study hard, you will pass the exam.",
    difficulty: 'intermediate',
    category: 'education',
    grammar_focus: 'first conditional'
  },
  {
    id: 'intermediate-4',
    words: ["She", "has", "been", "working", "at", "this", "company", "for", "five", "years"],
    correct: "She has been working at this company for five years.",
    difficulty: 'intermediate',
    category: 'work',
    grammar_focus: 'present perfect continuous'
  },
  {
    id: 'intermediate-5',
    words: ["The", "movie", "that", "we", "watched", "last", "night", "was", "amazing"],
    correct: "The movie that we watched last night was amazing.",
    difficulty: 'intermediate',
    category: 'entertainment',
    grammar_focus: 'relative clauses'
  },
  {
    id: 'intermediate-6',
    words: ["I", "wish", "I", "could", "speak", "French", "fluently"],
    correct: "I wish I could speak French fluently.",
    difficulty: 'intermediate',
    category: 'language',
    grammar_focus: 'wish + could'
  },

  // Advanced sentences
  {
    id: 'advanced-1',
    words: ["Had", "I", "known", "about", "the", "traffic", "I", "would", "have", "left", "earlier"],
    correct: "Had I known about the traffic, I would have left earlier.",
    difficulty: 'advanced',
    category: 'transportation',
    grammar_focus: 'third conditional'
  },
  {
    id: 'advanced-2',
    words: ["The", "project", "which", "was", "completed", "by", "our", "team", "exceeded", "all", "expectations"],
    correct: "The project which was completed by our team exceeded all expectations.",
    difficulty: 'advanced',
    category: 'work',
    grammar_focus: 'passive voice + relative clauses'
  },
  {
    id: 'advanced-3',
    words: ["Not", "only", "did", "she", "finish", "the", "race", "but", "she", "also", "won", "first", "place"],
    correct: "Not only did she finish the race, but she also won first place.",
    difficulty: 'advanced',
    category: 'sports',
    grammar_focus: 'inversion'
  },
  {
    id: 'advanced-4',
    words: ["The", "more", "you", "practice", "the", "better", "you", "will", "become"],
    correct: "The more you practice, the better you will become.",
    difficulty: 'advanced',
    category: 'education',
    grammar_focus: 'comparative structures'
  },
  {
    id: 'advanced-5',
    words: ["Were", "I", "to", "have", "more", "time", "I", "would", "travel", "around", "the", "world"],
    correct: "Were I to have more time, I would travel around the world.",
    difficulty: 'advanced',
    category: 'travel',
    grammar_focus: 'subjunctive mood'
  }
];

export function getRandomSentence(difficulty?: 'beginner' | 'intermediate' | 'advanced'): Sentence {
  const filteredSentences = difficulty 
    ? sentenceDatabase.filter(s => s.difficulty === difficulty)
    : sentenceDatabase;
  
  const randomIndex = Math.floor(Math.random() * filteredSentences.length);
  return filteredSentences[randomIndex];
}

export function getSentencesByCategory(category: string): Sentence[] {
  return sentenceDatabase.filter(s => s.category === category);
}

export function getSentencesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Sentence[] {
  return sentenceDatabase.filter(s => s.difficulty === difficulty);
}

export function getSentenceById(id: string): Sentence | undefined {
  return sentenceDatabase.find(s => s.id === id);
}
