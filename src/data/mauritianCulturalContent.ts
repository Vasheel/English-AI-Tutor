// Mauritian Cultural Content Database
// This file contains authentic Mauritian cultural content for educational purposes

export interface CulturalStory {
  id: string;
  title: string;
  topic: string;
  difficulty: number;
  content: string;
  culturalElements: string[];
  vocabulary: string[];
  questions: CulturalQuestion[];
  culturalQuestions: CulturalQuestion[]; // Specific cultural comprehension questions
}

export interface CulturalQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false';
  correct_answer: string;
  options?: string[];
  explanation: string;
}

export interface CulturalTopic {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  questions: CulturalQuestion[];
}

export interface CulturalVocabulary {
  word: string;
  meaning: string;
  context: string;
  origin: 'Creole' | 'French' | 'Hindi' | 'Tamil' | 'Chinese' | 'English';
  example: string;
}

// Mauritian Cultural Stories
export const mauritianStories: CulturalStory[] = [
  {
    id: 'sugar-cane-story',
    title: 'The Sugar Cane Harvest',
    topic: 'agriculture',
    difficulty: 1,
    content: `Marie lives in a small village near Flacq. Her family has been growing sugar cane for many years. Every morning, Marie helps her grandfather in the fields.

The sugar cane grows tall and green in the warm Mauritian sun. Marie's grandfather explains that sugar cane needs lots of water and sunshine to grow well. In Mauritius, the climate is perfect for growing sugar cane.

During harvest time, the whole village works together. People cut the sugar cane with sharp knives called "coupe-coupe". The cane is then taken to the sugar factory where it is processed into sugar.

Marie learns that Mauritius was once called the "sugar island" because sugar cane was the main crop. Today, sugar is still important for Mauritius, but the country also produces other things like textiles and tourism.

Marie feels proud to be part of this tradition. She knows that sugar cane farming has been part of Mauritian culture for over 200 years.`,
    culturalElements: ['Sugar cane farming', 'Village life', 'Family traditions', 'Mauritian agriculture'],
    vocabulary: ['harvest', 'coupe-coupe', 'processed', 'tradition', 'climate'],
    questions: [
      {
        id: 'sugar-cane-q1',
        question: 'What does Marie help her grandfather with?',
        type: 'multiple_choice',
        correct_answer: 'Growing sugar cane',
        options: ['Growing rice', 'Growing sugar cane', 'Growing tea', 'Growing vegetables'],
        explanation: 'Marie helps her grandfather grow sugar cane in their fields.'
      },
      {
        id: 'sugar-cane-q2',
        question: 'What tool is used to cut sugar cane?',
        type: 'short_answer',
        correct_answer: 'coupe-coupe',
        explanation: 'A coupe-coupe is a sharp knife used to cut sugar cane.'
      }
    ],
    culturalQuestions: [
      {
        id: 'sugar-cane-cultural-q1',
        question: 'Why is Mauritius called the "sugar island"?',
        type: 'multiple_choice',
        correct_answer: 'Sugar cane was the main crop',
        options: ['It has sweet water', 'Sugar cane was the main crop', 'People love sweets', 'It exports sugar'],
        explanation: 'Mauritius was called the "sugar island" because sugar cane was the main agricultural crop for over 200 years.'
      },
      {
        id: 'sugar-cane-cultural-q2',
        question: 'What does the story tell us about Mauritian village life?',
        type: 'short_answer',
        correct_answer: 'People work together and help each other',
        explanation: 'The story shows that in Mauritian villages, people work together during harvest time, helping each other as a community.'
      },
      {
        id: 'sugar-cane-cultural-q3',
        question: 'How long has sugar cane farming been part of Mauritian culture?',
        type: 'multiple_choice',
        correct_answer: 'Over 200 years',
        options: ['50 years', '100 years', 'Over 200 years', '300 years'],
        explanation: 'Sugar cane farming has been part of Mauritian culture for over 200 years, making it a deep-rooted tradition.'
      }
    ]
  },
  {
    id: 'port-louis-market',
    title: 'A Day at Port Louis Market',
    topic: 'culture',
    difficulty: 2,
    content: `Every Saturday morning, Priya and her mother visit the Central Market in Port Louis. The market is bustling with activity and filled with the sounds of vendors calling out their prices in different languages.

Priya's mother speaks Creole with the vegetable seller, French with the fishmonger, and Hindi with the spice merchant. This is common in Mauritius, where people often speak multiple languages.

The market is divided into different sections. In the vegetable section, Priya sees fresh tomatoes, eggplants, and chayote from local farms. The fish section has fresh tuna, marlin, and octopus caught by Mauritian fishermen. The spice section smells wonderful with curry powder, turmeric, and cinnamon.

Priya's favorite part is the fruit section. She loves the sweet mangoes, lychees, and longans that grow in Mauritius. Her mother buys some "goyave de Chine" (guava) and "corossol" (soursop) for dessert.

As they walk through the market, Priya hears different languages being spoken. She realizes that Mauritius is truly a multicultural country where people from different backgrounds live together peacefully.

The market is not just a place to buy food - it's a place where the community comes together. People meet their friends, share news, and celebrate the diversity that makes Mauritius special.`,
    culturalElements: ['Multiculturalism', 'Market culture', 'Languages', 'Local produce', 'Community'],
    vocabulary: ['bustling', 'vendors', 'fishmonger', 'merchant', 'multicultural'],
    questions: [
      {
        id: 'market-q1',
        question: 'How many languages does Priya\'s mother speak with different vendors?',
        type: 'multiple_choice',
        correct_answer: 'Three',
        options: ['One', 'Two', 'Three', 'Four'],
        explanation: 'She speaks Creole, French, and Hindi with different vendors.'
      },
      {
        id: 'market-q2',
        question: 'What makes Mauritius special according to the story?',
        type: 'short_answer',
        correct_answer: 'Multicultural diversity',
        explanation: 'Mauritius is special because people from different backgrounds live together peacefully.'
      }
    ],
    culturalQuestions: [
      {
        id: 'market-cultural-q1',
        question: 'What does the Port Louis market tell us about Mauritian society?',
        type: 'multiple_choice',
        correct_answer: 'It is multicultural and multilingual',
        options: ['It is only French-speaking', 'It is multicultural and multilingual', 'It is only English-speaking', 'It is only Creole-speaking'],
        explanation: 'The market shows that Mauritian society is multicultural, where people speak different languages and come from various backgrounds.'
      },
      {
        id: 'market-cultural-q2',
        question: 'Why do people speak different languages with different vendors?',
        type: 'short_answer',
        correct_answer: 'Different vendors come from different cultural backgrounds',
        explanation: 'Different vendors come from different cultural backgrounds, so people adapt their language to communicate effectively.'
      },
      {
        id: 'market-cultural-q3',
        question: 'What fruits mentioned in the story are typical of Mauritius?',
        type: 'multiple_choice',
        correct_answer: 'Mangoes, lychees, and longans',
        options: ['Apples and oranges', 'Mangoes, lychees, and longans', 'Bananas and grapes', 'Strawberries and blueberries'],
        explanation: 'Mangoes, lychees, and longans are tropical fruits that grow well in Mauritius\'s climate.'
      },
      {
        id: 'market-cultural-q4',
        question: 'What is the main purpose of the Port Louis market according to the story?',
        type: 'short_answer',
        correct_answer: 'Community gathering and cultural exchange',
        explanation: 'The market serves as more than just a place to buy food - it\'s where the community comes together and celebrates diversity.'
      }
    ]
  },
  {
    id: 'sega-dance',
    title: 'Learning Sega Dance',
    topic: 'music',
    difficulty: 2,
    content: `Jean-Claude is learning traditional Sega dance from his grandmother, Mémé Rose. Sega is the traditional music and dance of Mauritius, with roots in African culture.

Mémé Rose explains that Sega was created by enslaved Africans who came to Mauritius long ago. They used music and dance to express their feelings and keep their culture alive. The traditional instruments include the "ravanne" (a drum), "maravanne" (shaker), and "triangle".

Jean-Claude watches as Mémé Rose moves her hips and feet in the traditional Sega style. The dance is energetic and joyful, with movements that tell stories. Mémé Rose says that Sega is not just dancing - it's about expressing happiness, sadness, and hope.

The music has a special rhythm that makes people want to move. Mémé Rose teaches Jean-Claude the basic steps: swaying hips, moving feet in small steps, and using hand gestures to tell stories.

Jean-Claude learns that Sega has evolved over time. Today, there are different styles including traditional Sega, modern Sega, and Sega fusion that combines traditional elements with modern music.

Mémé Rose is proud that Jean-Claude wants to learn Sega. She tells him that by learning this dance, he is keeping an important part of Mauritian culture alive for future generations.`,
    culturalElements: ['Sega dance', 'African heritage', 'Traditional music', 'Cultural preservation', 'Family traditions'],
    vocabulary: ['ravanne', 'maravanne', 'energetic', 'evolved', 'fusion'],
    questions: [
      {
        id: 'sega-q1',
        question: 'What is the traditional drum used in Sega called?',
        type: 'multiple_choice',
        correct_answer: 'ravanne',
        options: ['ravanne', 'djembe', 'bongo', 'conga'],
        explanation: 'The ravanne is the traditional drum used in Sega music.'
      },
      {
        id: 'sega-q2',
        question: 'Why was Sega created by enslaved Africans?',
        type: 'short_answer',
        correct_answer: 'To express feelings and keep culture alive',
        explanation: 'Sega was created to express feelings and keep African culture alive.'
      }
    ],
    culturalQuestions: [
      {
        id: 'sega-cultural-q1',
        question: 'What does Sega represent in Mauritian culture?',
        type: 'multiple_choice',
        correct_answer: 'African heritage and cultural identity',
        options: ['Only entertainment', 'African heritage and cultural identity', 'Modern music', 'Foreign influence'],
        explanation: 'Sega represents the African heritage and cultural identity of Mauritius, connecting people to their roots.'
      },
      {
        id: 'sega-cultural-q2',
        question: 'What are the three traditional Sega instruments mentioned?',
        type: 'short_answer',
        correct_answer: 'ravanne, maravanne, triangle',
        explanation: 'The three traditional Sega instruments are the ravanne (drum), maravanne (shaker), and triangle.'
      },
      {
        id: 'sega-cultural-q3',
        question: 'How has Sega evolved over time?',
        type: 'multiple_choice',
        correct_answer: 'It now includes modern and fusion styles',
        options: ['It has disappeared', 'It stayed exactly the same', 'It now includes modern and fusion styles', 'It became foreign music'],
        explanation: 'Sega has evolved to include traditional Sega, modern Sega, and Sega fusion that combines traditional elements with modern music.'
      },
      {
        id: 'sega-cultural-q4',
        question: 'Why is it important for Jean-Claude to learn Sega?',
        type: 'short_answer',
        correct_answer: 'To keep Mauritian culture alive for future generations',
        explanation: 'Learning Sega helps preserve an important part of Mauritian culture for future generations.'
      }
    ]
  },
  {
    id: 'volcano-island',
    title: 'The Story of Mauritius Island',
    topic: 'geography',
    difficulty: 3,
    content: `Long ago, millions of years before humans arrived, Mauritius was born from a massive volcanic eruption deep in the Indian Ocean. The island emerged from the sea as a result of intense geological activity.

The volcanic origins of Mauritius created a unique landscape. The central plateau, where Curepipe is located, sits at about 600 meters above sea level. This highland area has a cooler climate than the coastal regions.

The island's volcanic past is still visible today. The Trou aux Cerfs crater near Curepipe is a dormant volcano that shows the island's fiery origins. The Black River Gorges National Park contains ancient volcanic rock formations and deep valleys carved by rivers.

Mauritius is part of the Mascarene Islands, along with Réunion and Rodrigues. These islands were all formed by the same volcanic hotspot that created a chain of islands in the Indian Ocean.

The volcanic soil of Mauritius is very fertile, which is why the island can grow such diverse crops. From sugar cane to tea, from vegetables to tropical fruits, the rich volcanic soil supports abundant agriculture.

The island's formation also created unique ecosystems. The native forests of Mauritius developed in isolation, leading to the evolution of unique species like the dodo bird (now extinct) and many endemic plants and animals found nowhere else in the world.

Today, Mauritius continues to be shaped by its volcanic heritage. The island's mountains, valleys, and fertile plains all tell the story of its dramatic birth from fire and water.`,
    culturalElements: ['Volcanic origins', 'Geological history', 'Island formation', 'Unique ecosystems', 'Natural heritage'],
    vocabulary: ['volcanic', 'eruption', 'dormant', 'endemic', 'ecosystems'],
    questions: [
      {
        id: 'volcano-q1',
        question: 'What is the height of the central plateau where Curepipe is located?',
        type: 'multiple_choice',
        correct_answer: 'About 600 meters',
        options: ['About 300 meters', 'About 600 meters', 'About 900 meters', 'About 1200 meters'],
        explanation: 'The central plateau sits at about 600 meters above sea level.'
      },
      {
        id: 'volcano-q2',
        question: 'What makes Mauritian soil so fertile?',
        type: 'short_answer',
        correct_answer: 'Volcanic origins',
        explanation: 'The volcanic soil of Mauritius is very fertile due to its volcanic origins.'
      }
    ],
    culturalQuestions: [
      {
        id: 'volcano-cultural-q1',
        question: 'What is the Trou aux Cerfs crater and why is it important?',
        type: 'multiple_choice',
        correct_answer: 'A dormant volcano showing Mauritius\'s volcanic origins',
        options: ['A water reservoir', 'A dormant volcano showing Mauritius\'s volcanic origins', 'A tourist attraction', 'A mining site'],
        explanation: 'Trou aux Cerfs is a dormant volcano crater near Curepipe that shows Mauritius\'s volcanic origins.'
      },
      {
        id: 'volcano-cultural-q2',
        question: 'What are the Mascarene Islands?',
        type: 'short_answer',
        correct_answer: 'Mauritius, Réunion, and Rodrigues',
        explanation: 'The Mascarene Islands are Mauritius, Réunion, and Rodrigues, all formed by the same volcanic hotspot.'
      },
      {
        id: 'volcano-cultural-q3',
        question: 'Why is Mauritius called an island of unique ecosystems?',
        type: 'multiple_choice',
        correct_answer: 'Native species evolved in isolation',
        options: ['It has no animals', 'Native species evolved in isolation', 'It has only foreign species', 'It has no plants'],
        explanation: 'Mauritius has unique ecosystems because native species evolved in isolation, creating species found nowhere else.'
      },
      {
        id: 'volcano-cultural-q4',
        question: 'What famous extinct bird was mentioned and why was it unique?',
        type: 'short_answer',
        correct_answer: 'The dodo bird - it was endemic to Mauritius',
        explanation: 'The dodo bird was endemic to Mauritius, meaning it was found nowhere else in the world, but it is now extinct.'
      },
      {
        id: 'volcano-cultural-q5',
        question: 'How does Mauritius\'s volcanic heritage affect agriculture today?',
        type: 'short_answer',
        correct_answer: 'The fertile volcanic soil supports diverse crops',
        explanation: 'The rich volcanic soil allows Mauritius to grow diverse crops from sugar cane to tea and tropical fruits.'
      }
    ]
  }
];

// Cultural Topics for Topic Questions
export const mauritianTopics: CulturalTopic[] = [
  {
    id: 'mauritian-history',
    name: 'Mauritian History',
    description: 'Learn about the rich history of Mauritius',
    difficulty: 2,
    questions: [
      {
        id: 'history-q1',
        question: 'Which European country first colonized Mauritius?',
        type: 'multiple_choice',
        correct_answer: 'The Netherlands',
        options: ['France', 'The Netherlands', 'Britain', 'Portugal'],
        explanation: 'The Dutch were the first Europeans to colonize Mauritius in 1638.'
      },
      {
        id: 'history-q2',
        question: 'What was Mauritius called during Dutch colonization?',
        type: 'short_answer',
        correct_answer: 'Mauritius',
        explanation: 'The Dutch named the island Mauritius after Prince Maurice of Nassau.'
      }
    ]
  },
  {
    id: 'mauritian-culture',
    name: 'Mauritian Culture',
    description: 'Explore the diverse cultural heritage of Mauritius',
    difficulty: 2,
    questions: [
      {
        id: 'culture-q1',
        question: 'What is the traditional music and dance of Mauritius called?',
        type: 'multiple_choice',
        correct_answer: 'Sega',
        options: ['Sega', 'Reggae', 'Calypso', 'Bhangra'],
        explanation: 'Sega is the traditional music and dance of Mauritius with African roots.'
      },
      {
        id: 'culture-q2',
        question: 'How many official languages does Mauritius have?',
        type: 'multiple_choice',
        correct_answer: 'None',
        options: ['One', 'Two', 'Three', 'None'],
        explanation: 'Mauritius has no official language, but English is used in government and education.'
      }
    ]
  },
  {
    id: 'mauritian-geography',
    name: 'Mauritian Geography',
    description: 'Discover the geography and natural features of Mauritius',
    difficulty: 2,
    questions: [
      {
        id: 'geo-q1',
        question: 'What is the capital city of Mauritius?',
        type: 'multiple_choice',
        correct_answer: 'Port Louis',
        options: ['Port Louis', 'Curepipe', 'Quatre Bornes', 'Rose Hill'],
        explanation: 'Port Louis is the capital and largest city of Mauritius.'
      },
      {
        id: 'geo-q2',
        question: 'What is the highest mountain in Mauritius?',
        type: 'short_answer',
        correct_answer: 'Piton de la Petite Rivière Noire',
        explanation: 'Piton de la Petite Rivière Noire is the highest peak at 828 meters.'
      }
    ]
  }
];

// Mauritian Vocabulary
export const mauritianVocabulary: CulturalVocabulary[] = [
  {
    word: 'coupe-coupe',
    meaning: 'A sharp knife used for cutting sugar cane',
    context: 'agriculture',
    origin: 'Creole',
    example: 'The farmer used his coupe-coupe to cut the sugar cane.'
  },
  {
    word: 'ravanne',
    meaning: 'Traditional drum used in Sega music',
    context: 'music',
    origin: 'Creole',
    example: 'The musician played the ravanne during the Sega performance.'
  },
  {
    word: 'goyave de Chine',
    meaning: 'Guava fruit',
    context: 'food',
    origin: 'French',
    example: 'We bought some goyave de Chine at the market.'
  },
  {
    word: 'corossol',
    meaning: 'Soursop fruit',
    context: 'food',
    origin: 'French',
    example: 'The corossol juice is very refreshing.'
  },
  {
    word: 'mémé',
    meaning: 'Grandmother',
    context: 'family',
    origin: 'French',
    example: 'Mémé Rose taught me how to cook.'
  },
  {
    word: 'papa',
    meaning: 'Father',
    context: 'family',
    origin: 'French',
    example: 'Papa is working in the sugar cane fields.'
  },
  {
    word: 'maman',
    meaning: 'Mother',
    context: 'family',
    origin: 'French',
    example: 'Maman is cooking dinner.'
  },
  {
    word: 'bazar',
    meaning: 'Market',
    context: 'shopping',
    origin: 'Hindi',
    example: 'Let\'s go to the bazar to buy vegetables.'
  },
  {
    word: 'namaste',
    meaning: 'Hello/greeting',
    context: 'greeting',
    origin: 'Hindi',
    example: 'Namaste, how are you today?'
  },
  {
    word: 'dholl puri',
    meaning: 'Traditional Mauritian flatbread',
    context: 'food',
    origin: 'Hindi',
    example: 'I love eating dholl puri with curry.'
  }
];

// Cultural Grammar Examples
export const mauritianGrammarExamples = [
  {
    sentence: 'Marie lives in Flacq.',
    correction: 'Marie lives in Flacq.',
    explanation: 'This sentence is correct. Flacq is a district in Mauritius.',
    culturalContext: 'Mauritian geography'
  },
  {
    sentence: 'The sugar cane grows tall in Mauritius.',
    correction: 'The sugar cane grows tall in Mauritius.',
    explanation: 'This sentence is correct. Sugar cane is an important crop in Mauritius.',
    culturalContext: 'Mauritian agriculture'
  },
  {
    sentence: 'Sega is the traditional dance of Mauritius.',
    correction: 'Sega is the traditional dance of Mauritius.',
    explanation: 'This sentence is correct. Sega is indeed the traditional music and dance of Mauritius.',
    culturalContext: 'Mauritian culture'
  },
  {
    sentence: 'Port Louis is the capital city.',
    correction: 'Port Louis is the capital city of Mauritius.',
    explanation: 'The sentence is grammatically correct but could be more specific by mentioning Mauritius.',
    culturalContext: 'Mauritian geography'
  }
];

// Export all cultural content
export const culturalContent = {
  stories: mauritianStories,
  topics: mauritianTopics,
  vocabulary: mauritianVocabulary,
  grammarExamples: mauritianGrammarExamples
};

export default culturalContent;
