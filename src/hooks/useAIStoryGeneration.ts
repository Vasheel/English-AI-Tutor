
import { useState } from 'react';

interface Story {
  title: string;
  content: string;
  topic: string;
  difficulty: number;
}

interface ClozeTest {
  text: string;
  blanks: { word: string; position: number }[];
  answers: string[];
}

export const useAIStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStory = async (topic: string, difficulty: number): Promise<Story | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulate AI story generation with predefined stories for different topics
      const stories = getStoriesByTopic(topic, difficulty);
      const randomStory = stories[Math.floor(Math.random() * stories.length)];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsGenerating(false);
      return randomStory;
    } catch (err) {
      setError('Failed to generate story');
      setIsGenerating(false);
      return null;
    }
  };

  const generateClozeTest = (text: string): ClozeTest => {
    const words = text.split(' ');
    const blanks: { word: string; position: number }[] = [];
    
    // Remove every 8th-12th word to create blanks
    const blankPositions = [];
    for (let i = 7; i < words.length; i += Math.floor(Math.random() * 5) + 8) {
      if (words[i].length > 3) { // Only blank meaningful words
        blankPositions.push(i);
      }
    }
    
    let clozeText = '';
    const answers: string[] = [];
    
    words.forEach((word, index) => {
      if (blankPositions.includes(index)) {
        const cleanWord = word.replace(/[^\w]/g, ''); // Remove punctuation for answer
        blanks.push({ word: cleanWord, position: index });
        answers.push(cleanWord);
        clozeText += '______ ';
      } else {
        clozeText += word + ' ';
      }
    });

    return {
      text: clozeText.trim(),
      blanks,
      answers
    };
  };

  return {
    generateStory,
    generateClozeTest,
    isGenerating,
    error
  };
};

const getStoriesByTopic = (topic: string, difficulty: number): Story[] => {
  const storyDatabase: Record<string, Story[]> = {
    animals: [
      {
        title: "The Clever Elephant",
        topic: "animals",
        difficulty: 1,
        content: `Ella the elephant was known for being very smart. She lived in a big forest with her family. Every day, Ella would help other animals solve their problems.

One hot summer day, all the water holes had dried up. The animals were very thirsty and didn't know what to do. Ella remembered seeing humans dig holes to find water underground.

Ella used her strong trunk to dig deep into the ground where the soil looked wet. After digging for a while, clean water started flowing out! All the forest animals came to drink from Ella's well.

The other animals were so grateful. They realized that Ella's intelligence had saved them all. From that day forward, whenever there was a problem in the forest, all the animals would ask Ella for help.

Ella felt proud that she could use her brain to help her friends. She learned that intelligence is best when it's used to help others.`
      },
      {
        title: "The Brave Little Penguin",
        topic: "animals", 
        difficulty: 2,
        content: `In the icy waters of Antarctica lived a young penguin named Pete. Unlike other penguins who stayed close to shore, Pete dreamed of exploring the deep ocean.

One day, Pete's little sister Penny fell through thin ice and got trapped underwater. The current was pulling her away from the colony. All the adult penguins were too scared to dive so deep in the dangerous waters.

Pete knew he had to act fast. Despite being smaller than the adults, he dove deeper than any penguin in his colony had ever gone before. The water was dark and cold, but Pete kept swimming toward where he had seen Penny disappear.

Finally, he found Penny caught in some seaweed. Pete quickly freed her and swam as fast as he could back to the surface. Both penguins were exhausted but safe.

The colony celebrated Pete's bravery. The elder penguins said that courage isn't about being big or strong - it's about doing what's right even when you're afraid.`
      }
    ],
    adventure: [
      {
        title: "The Secret Cave",
        topic: "adventure",
        difficulty: 1,
        content: `Sam and Lucy were exploring the mountains near their grandparents' house. They had been hiking for hours when they discovered a hidden cave behind a waterfall.

The cave was dark and mysterious. Sam turned on his flashlight and they carefully walked inside. The walls sparkled with beautiful crystals that reflected the light like stars.

As they went deeper, they found ancient drawings on the walls. The pictures showed people and animals from long ago. Lucy took photos with her camera to show their grandparents later.

Suddenly, they heard a rumbling sound. Rocks started falling from the ceiling! Sam and Lucy ran toward the entrance as fast as they could. They made it out just as more rocks blocked the cave entrance.

Back at their grandparents' house, they shared their amazing discovery. Their grandfather told them that local legends spoke of a crystal cave, but no one had found it for fifty years. Sam and Lucy had made an incredible discovery!`
      }
    ],
    science: [
      {
        title: "The Weather Experiment",
        topic: "science",
        difficulty: 2,
        content: `Maya loved science class, especially when they did experiments. Today, her teacher Ms. Rodriguez was teaching about weather patterns and how clouds form.

"Who can tell me what happens when warm air meets cold air?" asked Ms. Rodriguez. Maya raised her hand excitedly. She had been reading about this at home.

"The warm air rises because it's lighter, and when it gets high enough, it cools down and turns into water droplets that form clouds!" Maya explained.

"Excellent! Now let's see this in action," said Ms. Rodriguez. She filled a clear jar with hot water, then placed a plate with ice cubes on top. Within minutes, tiny water droplets began forming on the bottom of the cold plate.

"Look!" said Maya's classmate Jake. "It's like a mini rain cloud!" The class watched as the droplets grew bigger and eventually fell back into the jar like tiny raindrops.

Maya was amazed. She realized that the same process happening in their jar was happening in the sky every day. Science was everywhere around them, and understanding it made the world seem even more wonderful.`
      }
    ]
  };

  return storyDatabase[topic] || storyDatabase.animals;
};
