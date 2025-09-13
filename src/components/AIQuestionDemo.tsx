import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, RefreshCw } from 'lucide-react';
import type { AIQuestionResult } from '@/utils/generateAIQuestion';

const AIQuestionDemo: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestionResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<AIQuestionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string>('');
  const [weeklyLimits, setWeeklyLimits] = useState<Record<string, string>>({});

  const topics = [
    'tenses',
    'sentence structure', 
    'punctuation',
    'parts of speech',
    'vocabulary',
    'grammar',
    'comprehension'
  ] as const;

  // Weekly limit helper functions
  const getLastAttemptDate = (topic: string): string | null => {
    return localStorage.getItem(`ai_demo_last_attempt_${topic}`);
  };

  const setLastAttemptDate = (topic: string): void => {
    const now = new Date().toISOString();
    localStorage.setItem(`ai_demo_last_attempt_${topic}`, now);
    setWeeklyLimits(prev => ({ ...prev, [topic]: now }));
  };

  const canAttemptTopic = (topic: string): boolean => {
    const lastAttempt = getLastAttemptDate(topic);
    if (!lastAttempt) return true;
    
    const lastAttemptDate = new Date(lastAttempt);
    const now = new Date();
    const daysSinceLastAttempt = (now.getTime() - lastAttemptDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceLastAttempt >= 7;
  };

  const getNextAttemptDate = (topic: string): string => {
    const lastAttempt = getLastAttemptDate(topic);
    if (!lastAttempt) return '';
    
    const lastAttemptDate = new Date(lastAttempt);
    const nextAttemptDate = new Date(lastAttemptDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    return nextAttemptDate.toLocaleDateString();
  };

  const getDaysUntilNextAttempt = (topic: string): number => {
    const lastAttempt = getLastAttemptDate(topic);
    if (!lastAttempt) return 0;
    
    const lastAttemptDate = new Date(lastAttempt);
    const now = new Date();
    const nextAttemptDate = new Date(lastAttemptDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    const daysUntil = Math.ceil((nextAttemptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysUntil);
  };


  // Static questions for each topic
  const staticQuestions: Record<string, AIQuestionResult[]> = {
    'tenses': [
      {
        question: "Which sentence uses the present perfect tense correctly?",
        options: ["I have eaten lunch.", "I eat lunch yesterday.", "I will eat lunch.", "I eating lunch now."],
        correctAnswer: "A",
        explanation: "Present perfect uses 'have/has + past participle' to show completed actions.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "What is the past tense of 'go'?",
        options: ["goed", "went", "gone", "going"],
        correctAnswer: "B",
        explanation: "The past tense of 'go' is 'went', which is an irregular verb.",
        topic: "tenses",
        difficulty: 1
      },
      {
        question: "Which sentence is in future tense?",
        options: ["She reads books.", "She read books.", "She will read books.", "She is reading books."],
        correctAnswer: "C",
        explanation: "Future tense uses 'will + base verb' to show actions that will happen.",
        topic: "tenses",
        difficulty: 1
      },
      {
        question: "Complete: 'I _____ to school every day.'",
        options: ["go", "goes", "going", "went"],
        correctAnswer: "A",
        explanation: "Present simple tense uses base verb for first person singular.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "Which shows continuous action in the past?",
        options: ["I played football.", "I was playing football.", "I will play football.", "I have played football."],
        correctAnswer: "B",
        explanation: "Past continuous uses 'was/were + -ing' to show ongoing past actions.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "What is the present continuous form of 'run'?",
        options: ["runs", "ran", "running", "will run"],
        correctAnswer: "C",
        explanation: "Present continuous uses 'am/is/are + -ing' form of the verb.",
        topic: "tenses",
        difficulty: 1
      },
      {
        question: "Which sentence uses past perfect tense?",
        options: ["I had finished my homework.", "I finished my homework.", "I finish my homework.", "I will finish my homework."],
        correctAnswer: "A",
        explanation: "Past perfect uses 'had + past participle' to show actions completed before another past action.",
        topic: "tenses",
        difficulty: 3
      },
      {
        question: "Complete: 'She _____ her teeth every morning.'",
        options: ["brush", "brushes", "brushed", "brushing"],
        correctAnswer: "B",
        explanation: "Present simple uses 's' with third person singular (she, he, it).",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "What is the past tense of 'write'?",
        options: ["writed", "wrote", "written", "writing"],
        correctAnswer: "B",
        explanation: "The past tense of 'write' is 'wrote', which is an irregular verb.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "Which sentence is in present perfect continuous?",
        options: ["I have been working.", "I have worked.", "I am working.", "I was working."],
        correctAnswer: "A",
        explanation: "Present perfect continuous uses 'have/has + been + -ing' to show ongoing actions.",
        topic: "tenses",
        difficulty: 3
      },
      {
        question: "Complete: 'They _____ to the movies last night.'",
        options: ["go", "goes", "went", "going"],
        correctAnswer: "C",
        explanation: "Past simple tense uses the past form of the verb for completed actions.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "What is the future continuous form of 'study'?",
        options: ["will study", "will be studying", "studies", "studied"],
        correctAnswer: "B",
        explanation: "Future continuous uses 'will + be + -ing' to show ongoing future actions.",
        topic: "tenses",
        difficulty: 3
      },
      {
        question: "Which sentence uses present simple tense?",
        options: ["I am eating now.", "I eat breakfast daily.", "I was eating.", "I will eat later."],
        correctAnswer: "B",
        explanation: "Present simple describes habits, routines, and general truths.",
        topic: "tenses",
        difficulty: 1
      },
      {
        question: "Complete: 'By next year, I _____ my studies.'",
        options: ["finish", "will finish", "will have finished", "finished"],
        correctAnswer: "C",
        explanation: "Future perfect uses 'will + have + past participle' for actions completed before a future time.",
        topic: "tenses",
        difficulty: 3
      },
      {
        question: "What is the past participle of 'break'?",
        options: ["breaked", "broke", "broken", "breaking"],
        correctAnswer: "C",
        explanation: "The past participle of 'break' is 'broken', used in perfect tenses.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "Which sentence shows past perfect continuous?",
        options: ["I had been waiting.", "I was waiting.", "I have been waiting.", "I will be waiting."],
        correctAnswer: "A",
        explanation: "Past perfect continuous uses 'had + been + -ing' for ongoing actions before another past action.",
        topic: "tenses",
        difficulty: 3
      },
      {
        question: "Complete: 'The sun _____ in the east.'",
        options: ["rise", "rises", "rose", "rising"],
        correctAnswer: "B",
        explanation: "Present simple is used for general truths and facts.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "What is the present perfect form of 'see'?",
        options: ["sees", "saw", "seen", "seeing"],
        correctAnswer: "C",
        explanation: "Present perfect uses 'have/has + past participle', so 'have seen' or 'has seen'.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "Which sentence uses future perfect continuous?",
        options: ["I will have been working.", "I will be working.", "I have been working.", "I was working."],
        correctAnswer: "A",
        explanation: "Future perfect continuous uses 'will + have + been + -ing' for ongoing actions up to a future point.",
        topic: "tenses",
        difficulty: 3
      },
      {
        question: "Complete: 'I _____ my keys yesterday.'",
        options: ["lose", "loses", "lost", "losing"],
        correctAnswer: "C",
        explanation: "Past simple tense uses the past form of the verb for completed actions.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "What is the past tense of 'think'?",
        options: ["thinked", "thought", "thinking", "thinks"],
        correctAnswer: "B",
        explanation: "The past tense of 'think' is 'thought', which is an irregular verb.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "Which sentence uses present perfect tense?",
        options: ["I am reading a book.", "I read books daily.", "I have read this book.", "I will read tomorrow."],
        correctAnswer: "C",
        explanation: "Present perfect uses 'have/has + past participle' to show completed actions with present relevance.",
        topic: "tenses",
        difficulty: 2
      },
      {
        question: "Complete: 'She _____ her homework when I called.'",
        options: ["does", "did", "was doing", "will do"],
        correctAnswer: "C",
        explanation: "Past continuous shows an action in progress when another action happened.",
        topic: "tenses",
        difficulty: 3
      },
      {
        question: "What is the future tense of 'come'?",
        options: ["comes", "came", "will come", "coming"],
        correctAnswer: "C",
        explanation: "Future tense uses 'will + base verb' to show actions that will happen.",
        topic: "tenses",
        difficulty: 1
      },
      {
        question: "Which sentence uses past simple tense?",
        options: ["I am playing football.", "I play football daily.", "I played football yesterday.", "I will play football."],
        correctAnswer: "C",
        explanation: "Past simple uses the past form of the verb for completed actions in the past.",
        topic: "tenses",
        difficulty: 2
      }
    ],
    'sentence structure': [
      {
        question: "Which is a complete sentence?",
        options: ["The big dog.", "The dog runs fast.", "Running in the park.", "Big and fast."],
        correctAnswer: "B",
        explanation: "A complete sentence needs a subject and a verb.",
        topic: "sentence structure",
        difficulty: 1
      },
      {
        question: "What is the subject in: 'The children play in the garden.'?",
        options: ["play", "garden", "The children", "in the garden"],
        correctAnswer: "C",
        explanation: "The subject is who or what the sentence is about.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "Which sentence has correct word order?",
        options: ["Fast runs the boy.", "The boy runs fast.", "Runs the boy fast.", "Boy the fast runs."],
        correctAnswer: "B",
        explanation: "English follows Subject-Verb-Object order.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "What type of sentence is: 'What time is it?'",
        options: ["Statement", "Question", "Command", "Exclamation"],
        correctAnswer: "B",
        explanation: "Questions ask for information and end with a question mark.",
        topic: "sentence structure",
        difficulty: 1
      },
      {
        question: "Which is a compound sentence?",
        options: ["I like apples.", "I like apples and oranges.", "I like red apples.", "Apples are sweet."],
        correctAnswer: "B",
        explanation: "Compound sentences join two ideas with 'and', 'but', or 'or'.",
        topic: "sentence structure",
        difficulty: 3
      },
      {
        question: "What is the predicate in: 'The cat sleeps on the mat.'?",
        options: ["The cat", "sleeps on the mat", "on the mat", "cat sleeps"],
        correctAnswer: "B",
        explanation: "The predicate tells what the subject does or is.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "Which sentence is a fragment?",
        options: ["The dog barked loudly.", "Running in the park.", "I love pizza.", "She reads books."],
        correctAnswer: "B",
        explanation: "A fragment is an incomplete sentence missing a subject or verb.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "What is the object in: 'She reads a book.'?",
        options: ["She", "reads", "a book", "reads a book"],
        correctAnswer: "C",
        explanation: "The object receives the action of the verb.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "Which sentence is a command?",
        options: ["Please sit down.", "I am sitting.", "She sits there.", "They will sit."],
        correctAnswer: "A",
        explanation: "Commands give orders or instructions and often start with verbs.",
        topic: "sentence structure",
        difficulty: 1
      },
      {
        question: "What is a complex sentence?",
        options: ["I like pizza.", "I like pizza and pasta.", "I like pizza because it's tasty.", "Pizza is good."],
        correctAnswer: "C",
        explanation: "Complex sentences have one main clause and one or more dependent clauses.",
        topic: "sentence structure",
        difficulty: 3
      },
      {
        question: "Which sentence has a compound subject?",
        options: ["Tom runs fast.", "Tom and Jerry run fast.", "Tom runs and jumps.", "Fast running Tom."],
        correctAnswer: "B",
        explanation: "Compound subjects have two or more subjects joined by 'and' or 'or'.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "What is the main clause in: 'When I finish, I will go home.'?",
        options: ["When I finish", "I will go home", "finish, I will", "go home"],
        correctAnswer: "B",
        explanation: "The main clause can stand alone as a complete sentence.",
        topic: "sentence structure",
        difficulty: 3
      },
      {
        question: "Which sentence is a statement?",
        options: ["How are you?", "I am fine.", "Please help me!", "Stop running!"],
        correctAnswer: "B",
        explanation: "Statements make declarations and end with periods.",
        topic: "sentence structure",
        difficulty: 1
      },
      {
        question: "What is the dependent clause in: 'Because it's raining, we stay inside.'?",
        options: ["Because it's raining", "we stay inside", "it's raining", "stay inside"],
        correctAnswer: "A",
        explanation: "Dependent clauses cannot stand alone and start with words like 'because'.",
        topic: "sentence structure",
        difficulty: 3
      },
      {
        question: "Which sentence has correct punctuation?",
        options: ["What a beautiful day.", "What a beautiful day!", "What a beautiful day?", "What a beautiful day,"],
        correctAnswer: "B",
        explanation: "Exclamatory sentences show strong emotion and end with exclamation marks.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "What is the verb phrase in: 'She has been studying all night.'?",
        options: ["She", "has been studying", "studying all night", "all night"],
        correctAnswer: "B",
        explanation: "Verb phrases include the main verb and helping verbs.",
        topic: "sentence structure",
        difficulty: 3
      },
      {
        question: "Which sentence is a question?",
        options: ["I wonder about that.", "Do you know the answer?", "Tell me the answer.", "The answer is clear."],
        correctAnswer: "B",
        explanation: "Questions ask for information and often start with question words or helping verbs.",
        topic: "sentence structure",
        difficulty: 1
      },
      {
        question: "What is a simple sentence?",
        options: ["I like pizza.", "I like pizza and pasta.", "I like pizza because it's good.", "Pizza, which I like, is good."],
        correctAnswer: "A",
        explanation: "Simple sentences have one subject and one predicate.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "Which sentence has a compound predicate?",
        options: ["Tom runs fast.", "Tom and Jerry run.", "Tom runs and jumps.", "Fast running Tom."],
        correctAnswer: "C",
        explanation: "Compound predicates have two or more verbs for the same subject.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "What is the subject in: 'Under the tree sits a cat.'?",
        options: ["Under the tree", "sits", "a cat", "tree sits"],
        correctAnswer: "C",
        explanation: "Even in inverted sentences, the subject is who or what the sentence is about.",
        topic: "sentence structure",
        difficulty: 3
      },
      {
        question: "Which sentence is a run-on?",
        options: ["I like pizza. I like pasta.", "I like pizza and pasta.", "I like pizza, I like pasta.", "I like pizza; I like pasta."],
        correctAnswer: "C",
        explanation: "Run-on sentences join two complete thoughts without proper punctuation or conjunctions.",
        topic: "sentence structure",
        difficulty: 3
      },
      {
        question: "What is the predicate in: 'The flowers in the garden are beautiful.'?",
        options: ["The flowers", "in the garden", "are beautiful", "garden are beautiful"],
        correctAnswer: "C",
        explanation: "The predicate includes the verb and everything that follows it.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "Which sentence has a prepositional phrase?",
        options: ["The cat sleeps.", "The cat sleeps peacefully.", "The cat sleeps on the mat.", "The sleeping cat."],
        correctAnswer: "C",
        explanation: "Prepositional phrases start with prepositions like 'on', 'in', 'under'.",
        topic: "sentence structure",
        difficulty: 2
      },
      {
        question: "What is the direct object in: 'She gave him a book.'?",
        options: ["She", "gave", "him", "a book"],
        correctAnswer: "D",
        explanation: "The direct object receives the action directly from the verb.",
        topic: "sentence structure",
        difficulty: 3
      },
      {
        question: "Which sentence is an exclamation?",
        options: ["How are you?", "I am fine.", "What a surprise!", "Please help me."],
        correctAnswer: "C",
        explanation: "Exclamations express strong feelings and end with exclamation marks.",
        topic: "sentence structure",
        difficulty: 1
      }
    ],
    'punctuation': [
      {
        question: "Which sentence has correct punctuation?",
        options: ["Hello, how are you", "Hello, how are you?", "Hello how are you?", "Hello, how are you."],
        correctAnswer: "B",
        explanation: "Questions need question marks and greetings need commas.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "Where should the comma go in: 'I like apples bananas and oranges.'?",
        options: ["apples, bananas and oranges", "apples bananas, and oranges", "apples, bananas, and oranges", "No comma needed"],
        correctAnswer: "C",
        explanation: "Use commas to separate items in a list.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "Which sentence needs an apostrophe?",
        options: ["The cats tail is long.", "The cat's tail is long.", "The cat tail is long.", "The cats tails are long."],
        correctAnswer: "B",
        explanation: "Use apostrophes to show possession: cat's = belonging to the cat.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "What punctuation ends this sentence: 'Wow, that's amazing'",
        options: ["Period", "Question mark", "Exclamation mark", "Comma"],
        correctAnswer: "C",
        explanation: "Exclamations show strong feelings and end with exclamation marks.",
        topic: "punctuation",
        difficulty: 1
      },
      {
        question: "Which is correct: 'Its' or 'It's' for 'It is'?",
        options: ["Its", "It's", "Both are correct", "Neither is correct"],
        correctAnswer: "B",
        explanation: "'It's' is short for 'it is'. 'Its' shows possession.",
        topic: "punctuation",
        difficulty: 3
      },
      {
        question: "Where should the period go in: 'Dr Smith went to the store'",
        options: ["Dr. Smith went to the store.", "Dr Smith went to the store.", "Dr. Smith went to the store", "Dr Smith went to the store."],
        correctAnswer: "A",
        explanation: "Use periods after abbreviations and at the end of statements.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "Which sentence uses quotation marks correctly?",
        options: ["She said, 'Hello there.'", "She said, 'Hello there'.", "She said 'Hello there.'", "She said, Hello there."],
        correctAnswer: "A",
        explanation: "Quotation marks go around the exact words spoken, with punctuation inside.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "What punctuation is missing in: 'I need bread milk and eggs'",
        options: ["Period", "Comma", "Question mark", "Exclamation mark"],
        correctAnswer: "B",
        explanation: "Use commas to separate items in a list.",
        topic: "punctuation",
        difficulty: 1
      },
      {
        question: "Which sentence has correct apostrophe use?",
        options: ["The childrens toys", "The children's toys", "The childrens' toys", "The children toys"],
        correctAnswer: "B",
        explanation: "Use apostrophes to show possession: children's = belonging to the children.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "What punctuation should end: 'What time is it'",
        options: ["Period", "Comma", "Question mark", "Exclamation mark"],
        correctAnswer: "C",
        explanation: "Questions end with question marks.",
        topic: "punctuation",
        difficulty: 1
      },
      {
        question: "Which sentence uses semicolons correctly?",
        options: ["I like pizza; I like pasta.", "I like pizza, I like pasta.", "I like pizza; and I like pasta.", "I like pizza I like pasta."],
        correctAnswer: "A",
        explanation: "Semicolons join related complete sentences.",
        topic: "punctuation",
        difficulty: 3
      },
      {
        question: "Where should the comma go in: 'After school I will go home.'",
        options: ["After school, I will go home.", "After, school I will go home.", "After school I, will go home.", "No comma needed"],
        correctAnswer: "A",
        explanation: "Use commas after introductory phrases.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "Which sentence uses hyphens correctly?",
        options: ["She is a well-known author.", "She is a well known author.", "She is a wellknown author.", "She is a well, known author."],
        correctAnswer: "A",
        explanation: "Use hyphens to join compound adjectives before nouns.",
        topic: "punctuation",
        difficulty: 3
      },
      {
        question: "What punctuation is missing in: 'Help me please'",
        options: ["Period", "Comma", "Question mark", "Exclamation mark"],
        correctAnswer: "D",
        explanation: "Requests for help often end with exclamation marks.",
        topic: "punctuation",
        difficulty: 1
      },
      {
        question: "Which sentence uses colons correctly?",
        options: ["I need: bread, milk, and eggs.", "I need bread, milk, and eggs.", "I need: bread milk and eggs.", "I need bread: milk and eggs."],
        correctAnswer: "A",
        explanation: "Use colons to introduce lists.",
        topic: "punctuation",
        difficulty: 3
      },
      {
        question: "Where should the apostrophe go in: 'The dogs bowl is empty.'",
        options: ["The dog's bowl is empty.", "The dogs' bowl is empty.", "The dogs bowl is empty.", "The dog bowl is empty."],
        correctAnswer: "A",
        explanation: "Use apostrophes to show possession: dog's = belonging to the dog.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "Which sentence uses parentheses correctly?",
        options: ["My friend (who is tall) plays basketball.", "My friend who is tall (plays basketball.", "My friend who is tall plays basketball).", "My friend who is tall plays basketball."],
        correctAnswer: "A",
        explanation: "Parentheses add extra information and must be used in pairs.",
        topic: "punctuation",
        difficulty: 3
      },
      {
        question: "What punctuation should end: 'Stop running'",
        options: ["Period", "Comma", "Question mark", "Exclamation mark"],
        correctAnswer: "D",
        explanation: "Commands often end with exclamation marks to show urgency.",
        topic: "punctuation",
        difficulty: 1
      },
      {
        question: "Which sentence uses dashes correctly?",
        options: ["I love pizza—especially pepperoni.", "I love pizza - especially pepperoni.", "I love pizza, especially pepperoni.", "I love pizza especially pepperoni."],
        correctAnswer: "A",
        explanation: "Use em dashes to add emphasis or additional information.",
        topic: "punctuation",
        difficulty: 3
      },
      {
        question: "Where should the comma go in: 'Yes I will help you.'",
        options: ["Yes, I will help you.", "Yes I, will help you.", "Yes I will, help you.", "No comma needed"],
        correctAnswer: "A",
        explanation: "Use commas after introductory words like 'yes' and 'no'.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "Which sentence uses quotation marks correctly?",
        options: ["He said, 'I am tired.'", "He said, I am tired.", "He said 'I am tired'.", "He said, 'I am tired'."],
        correctAnswer: "A",
        explanation: "Quotation marks go around the exact words spoken.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "What punctuation is missing in: 'The book is on the table'",
        options: ["Period", "Comma", "Question mark", "Exclamation mark"],
        correctAnswer: "A",
        explanation: "Statements end with periods.",
        topic: "punctuation",
        difficulty: 1
      },
      {
        question: "Which sentence uses apostrophes correctly?",
        options: ["The cat's tail is long.", "The cats tail is long.", "The cat tail is long.", "The cats' tail is long."],
        correctAnswer: "A",
        explanation: "Use apostrophes to show possession: cat's = belonging to the cat.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "Where should the comma go in: 'My favorite colors are red blue and green.'",
        options: ["red, blue and green", "red blue, and green", "red, blue, and green", "No comma needed"],
        correctAnswer: "C",
        explanation: "Use commas to separate items in a list.",
        topic: "punctuation",
        difficulty: 2
      },
      {
        question: "Which sentence uses punctuation correctly?",
        options: ["What a beautiful day!", "What a beautiful day.", "What a beautiful day?", "What a beautiful day,"],
        correctAnswer: "A",
        explanation: "Exclamations show strong emotion and end with exclamation marks.",
        topic: "punctuation",
        difficulty: 1
      }
    ],
    'parts of speech': [
      {
        question: "What part of speech is 'quickly' in: 'She runs quickly.'?",
        options: ["Noun", "Verb", "Adverb", "Adjective"],
        correctAnswer: "C",
        explanation: "Adverbs describe how actions are done, often ending in -ly.",
        topic: "parts of speech",
        difficulty: 2
      },
      {
        question: "Which word is a noun?",
        options: ["run", "quickly", "beautiful", "house"],
        correctAnswer: "D",
        explanation: "Nouns are names of people, places, things, or ideas.",
        topic: "parts of speech",
        difficulty: 1
      },
      {
        question: "What part of speech is 'beautiful' in: 'The beautiful flower.'?",
        options: ["Noun", "Verb", "Adjective", "Adverb"],
        correctAnswer: "C",
        explanation: "Adjectives describe nouns and tell us what kind, which one, or how many.",
        topic: "parts of speech",
        difficulty: 2
      },
      {
        question: "Which word is a verb?",
        options: ["happy", "happiness", "happily", "happen"],
        correctAnswer: "D",
        explanation: "Verbs show actions or states of being.",
        topic: "parts of speech",
        difficulty: 2
      },
      {
        question: "What part of speech is 'under' in: 'The cat is under the table.'?",
        options: ["Noun", "Verb", "Preposition", "Conjunction"],
        correctAnswer: "C",
        explanation: "Prepositions show relationships between words, like position or time.",
        topic: "parts of speech",
        difficulty: 3
      }
    ],
    'vocabulary': [
      {
        question: "What does 'enormous' mean?",
        options: ["Very small", "Very large", "Very fast", "Very slow"],
        correctAnswer: "B",
        explanation: "Enormous means very large or huge.",
        topic: "vocabulary",
        difficulty: 2
      },
      {
        question: "Which word means the opposite of 'happy'?",
        options: ["Joyful", "Sad", "Excited", "Pleased"],
        correctAnswer: "B",
        explanation: "Sad is the opposite of happy.",
        topic: "vocabulary",
        difficulty: 1
      },
      {
        question: "What is a synonym for 'big'?",
        options: ["Small", "Large", "Tiny", "Little"],
        correctAnswer: "B",
        explanation: "Large is a synonym for big - they mean the same thing.",
        topic: "vocabulary",
        difficulty: 1
      },
      {
        question: "What does 'ancient' mean?",
        options: ["Very new", "Very old", "Very fast", "Very slow"],
        correctAnswer: "B",
        explanation: "Ancient means very old, from long ago.",
        topic: "vocabulary",
        difficulty: 2
      },
      {
        question: "Which word means 'to look at carefully'?",
        options: ["Glance", "Stare", "Examine", "Peek"],
        correctAnswer: "C",
        explanation: "To examine means to look at something carefully and in detail.",
        topic: "vocabulary",
        difficulty: 3
      }
    ],
    'grammar': [
      {
        question: "Which sentence is grammatically correct?",
        options: ["She don't like apples.", "She doesn't like apples.", "She not like apples.", "She no like apples."],
        correctAnswer: "B",
        explanation: "Use 'doesn't' with 'she' for negative present tense.",
        topic: "grammar",
        difficulty: 2
      },
      {
        question: "Complete: 'There _____ many books on the shelf.'",
        options: ["is", "are", "was", "were"],
        correctAnswer: "B",
        explanation: "Use 'are' with plural nouns like 'books'.",
        topic: "grammar",
        difficulty: 2
      },
      {
        question: "Which sentence uses 'a' and 'an' correctly?",
        options: ["A apple and an book", "An apple and a book", "A apple and a book", "An apple and an book"],
        correctAnswer: "B",
        explanation: "Use 'an' before words starting with vowels (a, e, i, o, u).",
        topic: "grammar",
        difficulty: 2
      },
      {
        question: "What is the plural of 'child'?",
        options: ["childs", "children", "childes", "child"],
        correctAnswer: "B",
        explanation: "Children is the irregular plural form of child.",
        topic: "grammar",
        difficulty: 2
      },
      {
        question: "Which sentence has correct subject-verb agreement?",
        options: ["The dogs barks loudly.", "The dogs bark loudly.", "The dog bark loudly.", "The dog barks loud."],
        correctAnswer: "B",
        explanation: "Plural subjects (dogs) need plural verbs (bark).",
        topic: "grammar",
        difficulty: 3
      }
    ],
    'comprehension': [
      {
        question: "If a story says 'The sky was dark and cloudy,' what might happen next?",
        options: ["The sun will shine brightly", "It might rain", "Birds will sing", "Flowers will bloom"],
        correctAnswer: "B",
        explanation: "Dark, cloudy skies usually mean rain is coming.",
        topic: "comprehension",
        difficulty: 2
      },
      {
        question: "What is the main idea of: 'Cats are independent animals. They can take care of themselves and don't need constant attention.'?",
        options: ["Cats are difficult pets", "Cats are independent", "Cats need lots of care", "Cats are noisy"],
        correctAnswer: "B",
        explanation: "The main idea is that cats are independent animals.",
        topic: "comprehension",
        difficulty: 2
      },
      {
        question: "If someone says 'I'm feeling under the weather,' what do they mean?",
        options: ["They are happy", "They are sick", "They are angry", "They are excited"],
        correctAnswer: "B",
        explanation: "'Under the weather' is an idiom meaning feeling sick or unwell.",
        topic: "comprehension",
        difficulty: 3
      },
      {
        question: "What can you infer from: 'Sarah packed her swimsuit and sunscreen.'?",
        options: ["She's going swimming", "She's going to school", "She's going to bed", "She's going shopping"],
        correctAnswer: "A",
        explanation: "Swimsuit and sunscreen suggest she's going somewhere to swim.",
        topic: "comprehension",
        difficulty: 2
      },
      {
        question: "What is the tone of: 'What a beautiful day! The sun is shining and birds are singing.'?",
        options: ["Sad", "Angry", "Happy", "Worried"],
        correctAnswer: "C",
        explanation: "The exclamation and positive descriptions show a happy, cheerful tone.",
        topic: "comprehension",
        difficulty: 2
      }
    ]
  };


  const generateQuestions = (topic: typeof topics[number]) => {
    setLoading(true);
    setError('');
    setSelectedAnswer('');
    setShowResult(false);

    try {
      // Check weekly limit first
      if (!canAttemptTopic(topic)) {
        const daysLeft = getDaysUntilNextAttempt(topic);
        const nextDate = getNextAttemptDate(topic);
        setError(`You can only attempt ${topic} questions once per week. Next attempt available in ${daysLeft} days (${nextDate}).`);
        return;
      }

      console.log(`🎯 Loading ${topic} questions...`);
      
      const topicQuestions = staticQuestions[topic] || [];
      if (topicQuestions.length === 0) {
        setError(`No questions available for topic: ${topic}`);
        return;
      }

      // Shuffle and take 5 questions (ensuring different questions each time)
      const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, 5);
      
      setQuestions(selectedQuestions);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(selectedQuestions[0]);
      
      // Record this attempt
      setLastAttemptDate(topic);
      
      console.log('✅ Questions loaded:', selectedQuestions.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      setSelectedAnswer('');
      setShowResult(false);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentQuestion(questions[prevIndex]);
      setSelectedAnswer('');
      setShowResult(false);
    }
  };


  const checkAnswer = () => {
    if (!currentQuestion) return;
    
    setShowResult(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    console.log(`📊 Answer check: ${selectedAnswer} vs ${currentQuestion.correctAnswer} = ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
  };


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          Topic Specific Practice Questions
        </h1>
        <p className="text-gray-600">Practice questions for Grade 6 students with weekly attempt limits</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Generate Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Topic Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => {
                const canAttempt = canAttemptTopic(topic);
                const daysLeft = getDaysUntilNextAttempt(topic);
                const nextDate = getNextAttemptDate(topic);
                
                return (
                  <div key={topic} className="flex flex-col items-center gap-1">
                    <Button
                      variant={canAttempt ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => generateQuestions(topic)}
                      disabled={loading || !canAttempt}
                      className={!canAttempt ? "opacity-60" : ""}
                    >
                      {topic}
                    </Button>
                    {!canAttempt && (
                      <span className="text-xs text-gray-500 text-center">
                        {daysLeft} days left
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Limit Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📅 Weekly Attempt Limits</h4>
            <p className="text-xs text-blue-700 mb-3">
              Each topic can only be attempted once per week. This encourages spaced learning and prevents over-practice.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {topics.map((topic) => {
                const canAttempt = canAttemptTopic(topic);
                const daysLeft = getDaysUntilNextAttempt(topic);
                const nextDate = getNextAttemptDate(topic);
                
                return (
                  <div key={topic} className={`p-2 rounded ${canAttempt ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    <div className="font-medium capitalize">{topic}</div>
                    <div className="text-xs">
                      {canAttempt ? '✅ Available' : `⏳ ${daysLeft} days`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generateQuestions('vocabulary')}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Generate Questions
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Display */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{currentQuestion.topic}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg font-medium text-gray-900">
              {currentQuestion.question}
            </div>

            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === String.fromCharCode(65 + index) ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setSelectedAnswer(String.fromCharCode(65 + index))}
                  disabled={showResult}
                >
                  <span className="mr-3 font-medium">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>

            {!showResult && (
              <Button
                onClick={checkAnswer}
                disabled={!selectedAnswer}
                className="w-full"
              >
                Check Answer
              </Button>
            )}

            {/* Navigation Controls */}
            {questions.length > 1 && (
              <div className="flex gap-2 justify-between">
                <Button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="flex-1"
                >
                  ← Previous
                </Button>
                <Button
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  variant="outline"
                  className="flex-1"
                >
                  Next →
                </Button>
              </div>
            )}

            {showResult && (
              <div className={`p-4 rounded-md ${
                selectedAnswer === currentQuestion.correctAnswer 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${
                    selectedAnswer === currentQuestion.correctAnswer ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedAnswer === currentQuestion.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Your answer:</strong> {selectedAnswer}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
                </p>
                {currentQuestion.explanation && (
                  <p className="text-sm text-blue-600 mt-2">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>• <strong>Topic buttons:</strong> Generate 5 practice questions for specific English topics</p>
          <p>• <strong>Weekly limits:</strong> Each topic can only be attempted once per week</p>
          <p>• <strong>Navigation:</strong> Use Previous/Next buttons to move between questions</p>
          <p>• <strong>Answer questions:</strong> Click an option and check your answer with explanations</p>
          <p>• <strong>Status tracking:</strong> Check the status grid to see which topics are available</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIQuestionDemo; 