interface Story {
  title: string;
  content: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
  clozeTest: {
    text: string;
    blanks: Array<{ word: string; position: number }>;
    answers: string[];
  };
  difficulty: number;
  topic: string;
  isCultural?: boolean;
}

interface StoryGenerationOptions {
  topic: string;
  difficulty: number;
  isCultural?: boolean;
  culturalContext?: string;
}

class StoryGenerationService {
  private API_KEY: string;
  private BASE_URL: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.API_KEY) {
      console.warn('OpenAI API key not found. Story generation will use fallback stories.');
    }
  }

  /**
   * Generate a story using OpenAI API
   */
  async generateStory(options: StoryGenerationOptions): Promise<Story> {
    if (!this.API_KEY) {
      return this.getFallbackStory(options);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(options);
      const userPrompt = this.buildUserPrompt(options);

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      
      return this.validateAndCleanStory(content, options);
    } catch (error) {
      console.error('Error generating story with OpenAI:', error);
      return this.getFallbackStory(options);
    }
  }

  /**
   * Build system prompt based on options
   */
  private buildSystemPrompt(options: StoryGenerationOptions): string {
    const basePrompt = `You are an expert English teacher creating engaging reading comprehension materials for students. 
    Generate a complete story package including the story, comprehension questions, and cloze test.`;

    if (options.isCultural && options.culturalContext) {
      return `${basePrompt}

    CULTURAL CONTEXT: Focus on ${options.culturalContext} culture, traditions, and way of life.
    Include authentic cultural elements, local customs, traditional practices, and cultural values.
    Make the story educational about the culture while being engaging for English learners.`;
    }

    return basePrompt;
  }

  /**
   * Build user prompt based on options
   */
  private buildUserPrompt(options: StoryGenerationOptions): string {
    const difficultyLevels = {
      1: "Beginner (simple vocabulary, short sentences, basic concepts)",
      2: "Intermediate (moderate vocabulary, varied sentence structures, more complex ideas)",
      3: "Advanced (rich vocabulary, complex sentences, sophisticated themes)"
    };

    const culturalPrompt = options.isCultural ? 
      `CULTURAL FOCUS: Create a story that authentically represents ${options.culturalContext} culture. Include:
      - Traditional customs and practices
      - Local landmarks or places
      - Cultural celebrations or events
      - Traditional foods, clothing, or activities
      - Cultural values and beliefs
      - Local language elements (with English translations)` : '';

    return `Create a ${difficultyLevels[options.difficulty as keyof typeof difficultyLevels]} reading comprehension story about "${options.topic}".

    ${culturalPrompt}

    Requirements:
    - Story length: ${this.getStoryLength(options.difficulty)} words
    - Age-appropriate content for educational use
    - Engaging and interesting narrative
    - Clear beginning, middle, and end
    - Include dialogue and descriptive language

    Return a JSON object with this exact structure:
    {
      "title": "Story Title",
      "content": "Full story text with proper paragraphs",
      "questions": [
        {
          "question": "Comprehension question",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct"
        }
      ],
      "clozeTest": {
        "text": "Story text with _____ for blanks",
        "blanks": [{"word": "missing", "position": 5}],
        "answers": ["missing"]
      },
      "difficulty": ${options.difficulty},
      "topic": "${options.topic}",
      "isCultural": ${options.isCultural || false}
    }

    Generate exactly 3 comprehension questions that test different aspects:
    1. Main idea or theme
    2. Specific details or facts
    3. Inference or critical thinking

    For the cloze test, create 5-8 blanks by replacing important words with _____.`;
  }

  /**
   * Get appropriate story length based on difficulty
   */
  private getStoryLength(difficulty: number): string {
    switch (difficulty) {
      case 1: return "150-200";
      case 2: return "250-350";
      case 3: return "400-500";
      default: return "250-350";
    }
  }

  /**
   * Validate and clean the generated story
   */
  private validateAndCleanStory(content: any, options: StoryGenerationOptions): Story {
    return {
      title: content.title || `${options.topic} Story`,
      content: content.content || '',
      questions: Array.isArray(content.questions) ? content.questions.slice(0, 3) : [],
      clozeTest: content.clozeTest || { text: '', blanks: [], answers: [] },
      difficulty: options.difficulty,
      topic: options.topic,
      isCultural: options.isCultural || false
    };
  }

  /**
   * Get fallback story when API is not available
   */
  private getFallbackStory(options: StoryGenerationOptions): Story {
    const fallbackStories = {
      general: {
        1: {
          title: "The Friendly Dog",
          content: "Max was a golden retriever who lived in a small town. Every morning, he would walk to the park with his owner, Sarah. Max loved to play with children and other dogs. He was known throughout the neighborhood for his gentle nature and wagging tail. One day, Max helped a lost child find their way home, making him a local hero.",
          questions: [
            {
              question: "What type of dog is Max?",
              options: ["Golden retriever", "German shepherd", "Labrador", "Beagle"],
              correctAnswer: 0,
              explanation: "The story clearly states that Max is a golden retriever."
            },
            {
              question: "What did Max do that made him a local hero?",
              options: ["He won a race", "He helped a lost child", "He learned tricks", "He made friends"],
              correctAnswer: 1,
              explanation: "Max became a local hero by helping a lost child find their way home."
            },
            {
              question: "What can we infer about Max's personality?",
              options: ["He is shy", "He is friendly and helpful", "He is aggressive", "He is lazy"],
              correctAnswer: 1,
              explanation: "The story describes Max as gentle, friendly, and helpful to others."
            }
          ],
          clozeTest: {
            text: "Max was a golden retriever who lived in a small town. Every morning, he would walk to the _____ with his owner, Sarah. Max loved to play with children and other dogs. He was known throughout the neighborhood for his gentle nature and wagging tail.",
            blanks: [{ word: "park", position: 4 }],
            answers: ["park"]
          }
        }
      },
      cultural: {
        1: {
          title: "A Day at the Port Louis Market",
          content: "Fatima woke up early to visit the Port Louis market with her grandmother. The market was bustling with vendors selling fresh vegetables, tropical fruits, and traditional Mauritian spices. Her grandmother taught her about local ingredients like cardamom, cinnamon, and vanilla. They bought fresh fish and vegetables for the family's dinner. Fatima learned about the importance of supporting local farmers and preserving Mauritian culinary traditions.",
          questions: [
            {
              question: "Where did Fatima go with her grandmother?",
              options: ["The beach", "Port Louis market", "A restaurant", "The mountains"],
              correctAnswer: 1,
              explanation: "The story states that Fatima went to the Port Louis market with her grandmother."
            },
            {
              question: "What did Fatima learn about at the market?",
              options: ["Swimming", "Cooking", "Local ingredients and spices", "Dancing"],
              correctAnswer: 2,
              explanation: "Fatima learned about local ingredients like cardamom, cinnamon, and vanilla."
            },
            {
              question: "What is the main theme of this story?",
              options: ["Learning about food", "Preserving cultural traditions", "Going shopping", "Spending time with family"],
              correctAnswer: 1,
              explanation: "The story emphasizes learning about and preserving Mauritian culinary traditions."
            }
          ],
          clozeTest: {
            text: "Fatima woke up early to visit the Port Louis market with her grandmother. The market was bustling with vendors selling fresh vegetables, tropical fruits, and traditional Mauritian _____.",
            blanks: [{ word: "spices", position: 4 }],
            answers: ["spices"]
          }
        }
      }
    };

    const storyType = options.isCultural ? 'cultural' : 'general';
    const story = fallbackStories[storyType][options.difficulty as keyof typeof fallbackStories.general] || 
                 fallbackStories.general[1];

    return {
      ...story,
      difficulty: options.difficulty,
      topic: options.topic,
      isCultural: options.isCultural || false
    };
  }
}

export const storyGenerationService = new StoryGenerationService();
export type { Story, StoryGenerationOptions };
