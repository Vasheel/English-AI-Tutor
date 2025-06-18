// 📁 psacVocabulary.ts — Fully typed PSAC-aligned word & grammar generator

export interface VocabWord {
  word: string;
  hint: string;
  topic: string;
}

export interface GrammarQuestion {
  question: string;
  options: string[];
  answer: string;
}

export const psacVocabulary: VocabWord[] = [
  {
    word: "HERITAGE",
    hint: "Passed down from ancestors",
    topic: "Culture"
  },
  {
    word: "FAINTED",
    hint: "Lost consciousness suddenly",
    topic: "Story Writing"
  },
  {
    word: "SAPSIPWAY",
    hint: "Traditional Mauritian game",
    topic: "Traditional Games"
  },
  {
    word: "COMPOSER",
    hint: "Someone who writes music",
    topic: "Music"
  },
  {
    word: "PENDANT",
    hint: "An ornament that hangs on a chain",
    topic: "Adventure Story"
  },
  {
    word: "GIGGLE",
    hint: "To laugh in a silly way",
    topic: "Feelings"
  },
  {
    word: "GRABBED",
    hint: "Took quickly or roughly",
    topic: "Action Verbs"
  },
  {
    word: "QUIETLY",
    hint: "In a silent way",
    topic: "Adverbs"
  }
];

export function generateGrammarQuestion(wordObj: VocabWord): GrammarQuestion | null {
  switch (wordObj.topic) {
    case "Culture":
      return {
        question: "Which of the following is a heritage site?",
        options: ["Shopping mall", "Fort Adelaide", "Bus station"],
        answer: "Fort Adelaide"
      };
    case "Story Writing":
      return {
        question: "What tense is used in 'She fainted suddenly'?",
        options: ["Present", "Past", "Future"],
        answer: "Past"
      };
    case "Traditional Games":
      return {
        question: "What is a sapsiway made from?",
        options: ["Paper", "Elastic bands", "Plastic bottle"],
        answer: "Elastic bands"
      };
    case "Music":
      return {
        question: "What does a composer do?",
        options: ["Write books", "Make music", "Paint"],
        answer: "Make music"
      };
    case "Adventure Story":
      return {
        question: "Where is a pendant usually worn?",
        options: ["On the finger", "Around the neck", "On the wrist"],
        answer: "Around the neck"
      };
    case "Feelings":
      return {
        question: "What does 'giggle' mean?",
        options: ["Shout loudly", "Laugh quietly", "Cry silently"],
        answer: "Laugh quietly"
      };
    case "Action Verbs":
      return {
        question: "Which word means the same as 'grabbed'?",
        options: ["Dropped", "Snatched", "Pushed"],
        answer: "Snatched"
      };
    case "Adverbs":
      return {
        question: "Which sentence uses 'quietly' correctly?",
        options: [
          "He quietly slammed the door.",
          "She shouted quietly.",
          "They danced quietly music."
        ],
        answer: "He quietly slammed the door."
      };
    default:
      return null;
  }
}
