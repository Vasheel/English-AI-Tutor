export interface Exercise {
  type: string;
  prompt: string;
  input: string;
  answer: string;
  explanation?: string;
}

// Sample data for generating exercises
const sampleSentences = [
  "The cat sits on the mat.",
  "Mary is happy it's her birthday.",
  "The children played on the playground.",
  "Maya is painting her room.",
  "The fisherman sat on the beach.",
  "The girl will recite a poem.",
  "We go to school every day.",
  "She plays with her dog.",
  "The teacher reads a book.",
  "The bird sings beautifully.",
  "The sun shines brightly.",
  "The dog runs fast.",
  "The boy eats an apple.",
  "The woman drives a car.",
  "The students study hard."
];

const extraWords = ["the", "a", "an", "and", "or", "but", "very", "quite", "really", "so", "too", "also"];
const adverbs = ["noisily", "quietly", "quickly", "slowly", "happily", "sadly", "carefully", "loudly", "softly", "gently", "angrily", "patiently"];
const wordPairs = [
  ["cyclone", "radio"],
  ["book", "library"],
  ["teacher", "student"],
  ["doctor", "hospital"],
  ["chef", "kitchen"],
  ["driver", "car"],
  ["artist", "canvas"],
  ["musician", "instrument"],
  ["farmer", "field"],
  ["pilot", "airplane"],
  ["sailor", "ship"],
  ["firefighter", "fire"]
];

// Generator functions for each exercise type
export const generateRemoveExtraWord = (): Exercise => {
  const sentence = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
  const words = sentence.split(' ');
  const insertIdx = Math.floor(Math.random() * (words.length - 1)) + 1; // Don't insert at beginning
  const extra = extraWords[Math.floor(Math.random() * extraWords.length)];
  const newWords = [...words.slice(0, insertIdx), extra, ...words.slice(insertIdx)];
  
  return {
    type: "remove_extra_word",
    prompt: "Remove the extra word from the sentence.",
    input: newWords.join(' '),
    answer: sentence,
    explanation: `The word "${extra}" was incorrectly added to the sentence.`
  };
};

export const generateAddPunctuation = (): Exercise => {
  const sentence = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
  const words = sentence.split(' ');
  const firstWord = words[0].toLowerCase();
  const restWords = words.slice(1).join(' ').replace(/[.!?]$/, '');
  
  return {
    type: "add_punctuation",
    prompt: "Add the required capital letter and full stop.",
    input: `${firstWord} ${restWords}`,
    answer: sentence,
    explanation: "The first word should be capitalized and the sentence should end with a period."
  };
};

export const generateAdverbPlacement = (): Exercise => {
  const sentence = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
  const adverb = adverbs[Math.floor(Math.random() * adverbs.length)];
  const words = sentence.split(' ');
  const verbIndex = words.findIndex(word => 
    ['is', 'was', 'are', 'were', 'played', 'sits', 'reads', 'sings', 'goes', 'plays', 'runs', 'eats', 'drives', 'studies', 'shines'].includes(word.toLowerCase())
  );
  
  if (verbIndex === -1) {
    // If no verb found, just add adverb at the end
    return {
      type: "adverb_placement",
      prompt: `Add the adverb '${adverb}' in the right place.`,
      input: sentence.replace(/[.!?]$/, ''),
      answer: sentence.replace(/[.!?]$/, '') + ` ${adverb}.`,
      explanation: `The adverb "${adverb}" should be placed after the verb to describe how the action is performed.`
    };
  }
  
  const newWords = [...words];
  newWords.splice(verbIndex + 1, 0, adverb);
  const answer = newWords.join(' ');
  
  return {
    type: "adverb_placement",
    prompt: `Add the adverb '${adverb}' in the right place.`,
    input: sentence.replace(/[.!?]$/, ''),
    answer: answer,
    explanation: `The adverb "${adverb}" should be placed after the verb to describe how the action is performed.`
  };
};

export const generateWordOrder = (): Exercise => {
  const sentence = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
  const words = sentence.split(' ').filter(word => word.length > 0);
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  
  return {
    type: "word_order",
    prompt: "Put the words in the correct order to form a proper sentence.",
    input: shuffled.join(' – '),
    answer: sentence,
    explanation: "The words need to be arranged in the correct grammatical order to form a meaningful sentence."
  };
};

export const generateNegativeForm = (): Exercise => {
  const sentence = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
  const words = sentence.split(' ');
  const firstWord = words[0].toLowerCase();
  
  let negativeAnswer = "";
  if (['the', 'a', 'an'].includes(firstWord)) {
    // Add "not" after the verb
    const verbIndex = words.findIndex(word => 
      ['is', 'was', 'are', 'were', 'will', 'can', 'could', 'should', 'would'].includes(word.toLowerCase())
    );
    if (verbIndex !== -1) {
      const newWords = [...words];
      newWords.splice(verbIndex + 1, 0, 'not');
      negativeAnswer = newWords.join(' ');
    } else {
      // For sentences without auxiliary verbs, add "does not" or "do not"
      const newWords = [...words];
      const subject = newWords[1]?.toLowerCase();
      if (subject === 'he' || subject === 'she' || subject === 'it') {
        newWords.splice(1, 0, 'does', 'not');
      } else {
        newWords.splice(1, 0, 'do', 'not');
      }
      negativeAnswer = newWords.join(' ');
    }
  }
  
  return {
    type: "negative_form",
    prompt: "Transform the sentence into its negative form.",
    input: sentence,
    answer: negativeAnswer || sentence.replace(/[.!?]$/, '') + " not.",
    explanation: "To make a sentence negative, we add 'not' after the auxiliary verb or use 'do not'/'does not' for simple present tense."
  };
};

export const generateInterrogativeForm = (): Exercise => {
  const sentence = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
  const words = sentence.split(' ');
  const firstWord = words[0].toLowerCase();
  
  let interrogativeAnswer = "";
  if (['is', 'was', 'are', 'were', 'will', 'can', 'could', 'should', 'would'].includes(firstWord)) {
    // Already has auxiliary verb, just move it to front
    const newWords = [...words];
    const auxiliary = newWords.shift();
    newWords[0] = newWords[0].toLowerCase();
    interrogativeAnswer = auxiliary + ' ' + newWords.join(' ');
  } else {
    // Add auxiliary verb
    const subject = words[1]?.toLowerCase();
    if (subject === 'he' || subject === 'she' || subject === 'it') {
      interrogativeAnswer = `Does ${words.slice(1).join(' ')}?`;
    } else {
      interrogativeAnswer = `Do ${words.slice(1).join(' ')}?`;
    }
  }
  
  return {
    type: "interrogative_form",
    prompt: "Transform the sentence into its interrogative form.",
    input: sentence,
    answer: interrogativeAnswer,
    explanation: "To make a question, we move the auxiliary verb to the beginning or add 'do'/'does' for simple present tense."
  };
};

export const generateUseGivenWords = (): Exercise => {
  const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
  
  return {
    type: "use_given_words",
    prompt: `Write one sentence using the following words: ${pair[0]} – ${pair[1]}`,
    input: `${pair[0]} – ${pair[1]}`,
    answer: `Sample: The ${pair[0]} damaged the ${pair[1]}.`, // This is just a sample, user can write any valid sentence
    explanation: `Write a meaningful sentence that includes both words: "${pair[0]}" and "${pair[1]}".`
  };
};

export const generateRandomExercise = (): Exercise => {
  const generators = [
    generateRemoveExtraWord,
    generateAddPunctuation,
    generateAdverbPlacement,
    generateWordOrder,
    generateNegativeForm,
    generateInterrogativeForm,
    generateUseGivenWords
  ];
  
  const randomGenerator = generators[Math.floor(Math.random() * generators.length)];
  return randomGenerator();
};

// Function to generate a specific type of exercise
export const generateExerciseByType = (type: string): Exercise => {
  switch (type) {
    case "remove_extra_word":
      return generateRemoveExtraWord();
    case "add_punctuation":
      return generateAddPunctuation();
    case "adverb_placement":
      return generateAdverbPlacement();
    case "word_order":
      return generateWordOrder();
    case "negative_form":
      return generateNegativeForm();
    case "interrogative_form":
      return generateInterrogativeForm();
    case "use_given_words":
      return generateUseGivenWords();
    default:
      return generateRandomExercise();
  }
};

// Function to get all available exercise types
export const getExerciseTypes = () => [
  { id: "remove_extra_word", name: "Remove Extra Word" },
  { id: "add_punctuation", name: "Add Punctuation" },
  { id: "adverb_placement", name: "Adverb Placement" },
  { id: "word_order", name: "Word Order" },
  { id: "negative_form", name: "Negative Form" },
  { id: "interrogative_form", name: "Interrogative Form" },
  { id: "use_given_words", name: "Use Given Words" }
]; 